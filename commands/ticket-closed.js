const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const transcriptsPath = path.join(__dirname, '../transcripts.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-closed')
        .setDescription('Quản lý các ticket đã đóng.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Liệt kê các ticket đã đóng.'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'list') {
            let data = {};
            try {
                data = JSON.parse(fs.readFileSync(transcriptsPath, 'utf8'));
            } catch (e) {
                data = {};
            }

            const tickets = Object.keys(data);
            if (tickets.length === 0) {
                return interaction.reply({ content: 'Chưa có ticket nào được đóng.', ephemeral: true });
            }
            
            const listEmbed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle('Danh Sách Ticket Đã Đóng')
                .setDescription('Dưới đây là danh sách các ticket đã đóng. Bạn có thể sử dụng ID này để mở lại ticket.')
                .addFields(
                    tickets.map(ticketId => {
                        const ticketInfo = data[ticketId];
                        const userTag = interaction.client.users.cache.get(ticketInfo.user)?.tag || 'Không tìm thấy người dùng';
                        return {
                            name: `Ticket ID: ${ticketId}`,
                            value: `**Người tạo:** ${userTag}\n**Thời gian đóng:** ${new Date(ticketInfo.timestamp).toLocaleString('vi-VN')}\n**File transcript:** [Tải xuống](${ticketInfo.url})`,
                            inline: false
                        };
                    })
                )
                .setFooter({ text: `Được yêu cầu bởi ${interaction.user.tag}` })
                .setTimestamp();
            
            await interaction.reply({ embeds: [listEmbed], ephemeral: true });
        }
    },
};