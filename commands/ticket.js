const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const transcriptsPath = path.join(__dirname, '../transcripts.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Lệnh quản lý hệ thống ticket.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('new')
                .setDescription('Mở một ticket hỗ trợ mới.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reopen')
                .setDescription('Mở lại một ticket đã đóng.')
                .addStringOption(option =>
                    option.setName('ticket_id')
                        .setDescription('ID của ticket muốn mở lại.')
                        .setRequired(true))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const { client, guild, user } = interaction;

        // Xử lý lệnh: /ticket new
        if (subcommand === 'new') {
            const existingTicket = guild.channels.cache.find(c =>
                c.topic?.includes(`ID: ${user.id}`)
            );

            if (existingTicket) {
                return interaction.reply({ content: `Bạn đã có một ticket đang mở tại ${existingTicket}!`, ephemeral: true });
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_topic')
                .setPlaceholder('Chọn một chủ đề...')
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Hỗ trợ chung')
                        .setDescription('Yêu cầu hỗ trợ về các vấn đề chung.')
                        .setValue('hỗ trợ chung'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Góp ý/Đề xuất')
                        .setDescription('Đóng góp ý kiến hoặc đề xuất tính năng mới.')
                        .setValue('góp ý/đề xuất'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Báo cáo lỗi')
                        .setDescription('Báo cáo lỗi hoặc vấn đề kỹ thuật.')
                        .setValue('báo cáo lỗi'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Khác')
                        .setDescription('Chọn tùy chọn này nếu không có chủ đề phù hợp.')
                        .setValue('khác')
                );

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.reply({
                content: 'Vui lòng chọn một chủ đề cho ticket của bạn:',
                components: [row],
                ephemeral: true,
            });
            return;
        }
        // Xử lý lệnh: /ticket reopen
        else if (subcommand === 'reopen') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return interaction.reply({ content: 'Bạn không có quyền để sử dụng lệnh này.', ephemeral: true });
            }
            
            await interaction.deferReply({ ephemeral: true });
            const ticketId = interaction.options.getString('ticket_id');

            let transcripts = {};
            try {
                transcripts = JSON.parse(fs.readFileSync(transcriptsPath, 'utf8'));
            } catch (e) {
                transcripts = {};
            }

            const transcriptData = transcripts[ticketId];
            if (!transcriptData) {
                return interaction.editReply({ content: 'Không tìm thấy ticket đã đóng với ID này.', ephemeral: true });
            }

            const existingTicket = guild.channels.cache.find(c =>
                c.topic?.includes(`ID: ${transcriptData.user}`)
            );
            if (existingTicket) {
                 return interaction.editReply({ content: `Ticket của người dùng này đang mở tại ${existingTicket}!`, ephemeral: true });
            }

            try {
                const user = await client.users.fetch(transcriptData.user);
                const ticketTopic = `Được mở lại bởi: ${interaction.user.tag} - Người tạo cũ: ${user.tag} - ID: ${user.id}`;

                const ticketChannel = await guild.channels.create({
                    name: `ticket-reopen-${ticketId}`,
                    type: ChannelType.GuildText,
                    topic: ticketTopic,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: transcriptData.user,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                        },
                        {
                            id: client.user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
                        }
                    ],
                });

                await ticketChannel.setPosition(0);

                const reopenEmbed = new EmbedBuilder()
                    .setColor('#2ecc71') // Đã đổi sang màu xanh lá
                    .setTitle('Ticket Đã Được Mở Lại')
                    .setDescription(`Ticket này được mở lại bởi ${interaction.user.tag}.\n\nĐây là transcript của cuộc trò chuyện cũ:`)
                    .addFields(
                        { name: 'Người dùng', value: user.tag, inline: true },
                        { name: 'Thời gian đóng cũ', value: new Date(transcriptData.timestamp).toLocaleString('vi-VN'), inline: true },
                        { name: 'ID Ticket', value: ticketId, inline: false }
                    )
                    .setTimestamp();

                const closeButton = new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Đóng Ticket')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒');

                const row = new ActionRowBuilder().addComponents(closeButton);

                await ticketChannel.send({ embeds: [reopenEmbed], components: [row] });
                await ticketChannel.send({ content: `[Bản ghi cũ](${transcriptData.url})` });

                delete transcripts[ticketId];
                fs.writeFileSync(transcriptsPath, JSON.stringify(transcripts, null, 4));

                return interaction.editReply({ content: `Ticket \`#${ticketId}\` đã được mở lại thành công tại ${ticketChannel}!`, ephemeral: true });

            } catch (error) {
                console.error(error);
                return interaction.editReply({ content: 'Có lỗi xảy ra khi mở lại ticket.', ephemeral: true });
            }
        }
    },
};