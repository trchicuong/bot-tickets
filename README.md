# 🎫 Discord Ticket Bot - Bot quản lý ticket

Dự án Bot quản lý ticket trên Discord đơn giản, hiệu quả dùng `discordjs` phù hợp tất cả mọi người, lưu ticket bằng file local & logs channel (không yêu cầu database), dễ deploy/chạy bot.

> **[Server discord](https://byvn.net/northUS)**

---

### 📥 Tải về

**Clone từ GitHub:**
```bash
git clone https://github.com/trchicuong/bot-tickets.git
cd bot-tickets
```
Hoặc tải file `.zip` trực tiếp từ repository.

---

### ⚙️ Cài đặt & Chạy

1.  **Cài đặt các gói phụ thuộc:**
    ```bash
    npm install
    ```

2.  **Thêm API Key:**
    - Thay đầy đủ các trường trong file `config.json` trong thư mục gốc của dự án.
      ```
      {
        "token": "your-bot-token-here",
        "clientId": "your-client-id-here",
        "guildId": "your-guild-id-here",
        "logChannelId": "your-log-channel-id-here"
      }
      ```
    > "logChannelId" là kênh bot sẽ gửi tin nhắn của các ticket đã đóng (rất quan trọng).

3.  **Chạy bot thử:**
    ```bash
    node . 
    node index.js
    ```

4.  **Setup bot:**
    Dùng lệnh `/setup-ticket` chọn kênh cho bot gửi embed create ticket.

5. **Các lệnh khác:**
    `/ticket new`, `/ticket reopen`, `/ticket-closed list`

---

### 📁 Cấu trúc thư mục

```
bot-tickets/
├── commands/
│   └── ... (các lệnh)
├── events/
│   └── interactionCreate.js
├── .gitignore
├── config.json
├── index.js
├── LICENSE
├── package.json
├── README.md
└── transcripts.json
```
---

### ✉️ Góp ý & Liên hệ

Nếu bạn có bất kỳ ý tưởng nào để cải thiện dự án hoặc phát hiện lỗi, đừng ngần ngại mở một `Issue` trên repo này hoặc tham gia vào server discord ở trên.

Mọi thông tin khác, bạn có thể liên hệ với tôi qua:
[**trchicuong.id.vn**](https://trchicuong.id.vn/)