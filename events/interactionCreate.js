const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, AttachmentBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { logChannelId } = require('../config.json');

const transcriptsPath = path.join(__dirname, '../transcripts.json');

function saveTranscript(ticketId, transcript) {
    let data = {};
    try {
        data = JSON.parse(fs.readFileSync(transcriptsPath, 'utf8'));
    } catch (e) {
        data = {};
    }
    data[ticketId] = transcript;
    fs.writeFileSync(transcriptsPath, JSON.stringify(data, null, 4));
}

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isCommand()) {
            return;
        }

        const { channel, customId, user, client, guild } = interaction;

        if (customId === 'create_ticket') {
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
        
        if (customId === 'select_topic') {
            const selectedTopic = interaction.values[0];

            if (selectedTopic === 'khác') {
                const modal = new ModalBuilder()
                    .setCustomId('custom_topic_modal')
                    .setTitle('Nhập chủ đề tùy chỉnh');
                
                const topicInput = new TextInputBuilder()
                    .setCustomId('custom_topic_input')
                    .setLabel('Chủ đề')
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(1)
                    .setMaxLength(50)
                    .setRequired(true);

                const firstActionRow = new ActionRowBuilder().addComponents(topicInput);
                modal.addComponents(firstActionRow);

                await interaction.showModal(modal);
                return;
            }

            await interaction.deferReply({ ephemeral: true });

            try {
                const now = new Date();
                const ticketTopic = `Tạo bởi: ${user.tag} - Chủ đề: ${selectedTopic} - ID: ${user.id}`;
                const ticketChannel = await guild.channels.create({
                    name: `ticket-${user.username}-${now.getTime()}`,
                    type: ChannelType.GuildText,
                    topic: ticketTopic,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                        },
                        {
                            id: client.user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
                        }
                    ],
                });

                await ticketChannel.setPosition(0);

                const ticketEmbed = new EmbedBuilder()
                    .setColor('#2ecc71')
                    .setTitle('🎫 Ticket Hỗ Trợ Mới')
                    .setDescription(`Chào mừng <@${user.id}>, bạn đã tạo ticket thành công! Đội ngũ hỗ trợ sẽ có mặt sớm nhất có thể.\n\n**Chủ đề**: ${selectedTopic}`)
                    .setTimestamp()
                    .setFooter({ text: `Hệ thống Ticket | ID người dùng: ${user.id}` });
                
                const closeButton = new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Đóng Ticket')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒');

                const row = new ActionRowBuilder().addComponents(closeButton);

                await ticketChannel.send({ content: `<@${user.id}>`, embeds: [ticketEmbed], components: [row] });

                return interaction.editReply({ content: `Ticket của bạn đã được tạo tại ${ticketChannel} với chủ đề: **${selectedTopic}**!`, ephemeral: true });

            } catch (error) {
                console.error(error);
                return interaction.editReply({ content: 'Có lỗi xảy ra khi tạo ticket. Vui lòng kiểm tra quyền của bot.', ephemeral: true });
            }
        }
        
        if (interaction.isModalSubmit() && interaction.customId === 'custom_topic_modal') {
            await interaction.deferReply({ ephemeral: true });
            const customTopic = interaction.fields.getTextInputValue('custom_topic_input');
            
            try {
                const now = new Date();
                const ticketTopic = `Tạo bởi: ${user.tag} - Chủ đề: ${customTopic} - ID: ${user.id}`;
                const ticketChannel = await guild.channels.create({
                    name: `ticket-${user.username}-${now.getTime()}`,
                    type: ChannelType.GuildText,
                    topic: ticketTopic,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                        },
                        {
                            id: client.user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
                        }
                    ],
                });
                
                await ticketChannel.setPosition(0);
                
                const ticketEmbed = new EmbedBuilder()
                    .setColor('#2ecc71')
                    .setTitle('🎫 Ticket Hỗ Trợ Mới')
                    .setDescription(`Chào mừng <@${user.id}>, bạn đã tạo ticket thành công! Đội ngũ hỗ trợ sẽ có mặt sớm nhất có thể.\n\n**Chủ đề**: ${customTopic}`)
                    .setTimestamp()
                    .setFooter({ text: `Hệ thống Ticket | ID người dùng: ${user.id}` });

                const closeButton = new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Đóng Ticket')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒');

                const row = new ActionRowBuilder().addComponents(closeButton);

                await ticketChannel.send({ content: `<@${user.id}>`, embeds: [ticketEmbed], components: [row] });
                
                return interaction.editReply({ content: `Ticket của bạn đã được tạo tại ${ticketChannel} với chủ đề: **${customTopic}**!`, ephemeral: true });

            } catch (error) {
                console.error(error);
                return interaction.editReply({ content: 'Có lỗi xảy ra khi tạo ticket. Vui lòng kiểm tra quyền của bot.', ephemeral: true });
            }
        }

        if (interaction.isButton()) {
            if (customId === 'close_ticket') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                    return interaction.reply({ content: 'Bạn không có quyền để đóng ticket này.', ephemeral: true });
                }

                const confirmEmbed = new EmbedBuilder()
                    .setColor('#e74c3c')
                    .setTitle('⚠️ Xác nhận Đóng Ticket')
                    .setDescription('Hành động này sẽ đóng và lưu lại bản ghi của ticket. Bạn có chắc chắn muốn tiếp tục không?');

                const confirmButton = new ButtonBuilder()
                    .setCustomId('confirm_close')
                    .setLabel('Xác nhận Đóng')
                    .setStyle(ButtonStyle.Success);

                const cancelButton = new ButtonBuilder()
                    .setCustomId('cancel_close')
                    .setLabel('Hủy')
                    .setStyle(ButtonStyle.Secondary);

                const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

                await interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: true });
            }
            
            if (customId === 'confirm_close') {
                await interaction.deferReply({ ephemeral: true });

                const messages = await channel.messages.fetch({ limit: 100 });
                const userIdMatch = channel.topic?.match(/ID: (\d+)/);
                const userId = userIdMatch ? userIdMatch[1] : channel.topic;
                const userTag = guild.members.cache.get(userId)?.user.tag || 'Không tìm thấy người dùng';
                
                const topicMatch = channel.topic?.match(/Chủ đề: (.+) - ID:/);
                const ticketTopic = topicMatch ? topicMatch[1] : 'Không rõ';

                const creationTime = new Date(messages.last()?.createdTimestamp).toLocaleString('vi-VN');
                const closeTime = new Date().toLocaleString('vi-VN');

                let transcriptHeader = 
                    `--- Transcript Ticket ---\n` +
                    `ID Ticket: #${channel.name}\n` +
                    `Chủ đề: ${ticketTopic}\n` +
                    `Người tạo: ${userTag}\n` +
                    `Thời gian tạo: ${creationTime}\n` +
                    `Thời gian đóng: ${closeTime}\n` +
                    `Người đóng: ${user.tag}\n` +
                    `--- Lịch sử chat ---\n\n`;

                const transcriptContent = messages.reverse().map(msg => 
                    `[${new Date(msg.createdTimestamp).toLocaleString('vi-VN')}] ${msg.author.tag}: ${msg.content}`
                ).join('\n');

                const fullTranscript = transcriptHeader + transcriptContent;

                const fileName = `${channel.name}.txt`;
                const transcriptAttachment = new AttachmentBuilder(Buffer.from(fullTranscript), { name: fileName });

                const logChannel = guild.channels.cache.get(logChannelId);

                if (logChannel) {
                    const logMessage = await logChannel.send({ content: `Ticket từ <@${userId}> đã được đóng.`, files: [transcriptAttachment] });
                    const transcriptUrl = logMessage.attachments.first()?.url;
                    if (transcriptUrl) {
                        saveTranscript(channel.name.replace('ticket-reopen-', '').replace('ticket-', ''), {
                            user: userId,
                            url: transcriptUrl,
                            timestamp: Date.now()
                        });
                    }
                }

                const closeEmbed = new EmbedBuilder()
                    .setColor('#e74c3c')
                    .setTitle('🔒 Ticket Đã Đóng')
                    .setDescription(`Ticket này đã được đóng bởi <@${user.id}>. Kênh sẽ tự động xóa sau 3 giây.`)
                    .setTimestamp()
                    .setFooter({ text: `Hệ thống Ticket | ID ticket: #${channel.name}` });

                await channel.send({ embeds: [closeEmbed] });

                setTimeout(() => {
                    channel.delete().catch(console.error);
                }, 3000); // Đã đổi thời gian thành 3 giây
            }

            if (customId === 'cancel_close') {
                await interaction.reply({ content: 'Đã hủy đóng ticket.', ephemeral: true });
            }
        }
    },
};