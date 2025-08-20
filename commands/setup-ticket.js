const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-ticket')
        .setDescription('Thiết lập kênh gửi ticket.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Chọn kênh để gửi embed ticket vào.')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        const embed = new EmbedBuilder()
            .setColor('#2ecc71') // Đã đổi sang màu xanh lá
            .setTitle('Hệ Thống Hỗ Trợ Ticket 🎫')
            .setDescription('Để tạo một ticket, vui lòng nhấn vào nút bên dưới.\nMột kênh chat mới sẽ được tạo để bạn có thể trao đổi với đội ngũ hỗ trợ của chúng tôi!')
            .setTimestamp()
            .setFooter({ text: 'Developed with love by cuongisreal IT ❤️' });

        const button = new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('Mở Ticket')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📨');

        const row = new ActionRowBuilder().addComponents(button);

        try {
            await channel.send({ embeds: [embed], components: [row] });
            await interaction.reply({ content: `Đã gửi embed setup ticket thành công vào kênh ${channel}!`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Đã xảy ra lỗi khi gửi embed. Vui lòng kiểm tra lại quyền của bot.', ephemeral: true });
        }
    },
};