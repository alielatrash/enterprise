# 📰 MENA Daily Digest

**Your daily news summary from the Middle East & North Africa - powered by AI**

A beautiful, user-friendly website that automatically curates and summarizes the most important news from the MENA region every day. No coding required to use!

---

## 🌟 What is This?

MENA Daily Digest is a smart news service that:

- **Collects** news from trusted sources across Egypt, Saudi Arabia, UAE, and the wider MENA region
- **Analyzes** hundreds of articles using AI to find what's most important
- **Summarizes** the top stories into an easy-to-read daily digest
- **Delivers** your personalized news summary every morning at 8:30 AM Cairo time

**Perfect for:** Business professionals, researchers, journalists, or anyone who wants to stay informed about the MENA region without information overload.

---

## 🚀 Quick Start (For Non-Technical Users)

### Option 1: Use the Website (Easiest)

1. Open your web browser
2. Go to `http://your-server-url:8000` (ask your system administrator for the URL)
3. That's it! You'll see today's digest right away

### Option 2: Set Up Your Own (Simple Steps)

**Prerequisites:**
- A computer with Python 3.11+ installed
- Internet connection
- 10 minutes of your time

**Installation:**

1. **Download this project**
   ```bash
   # Download and extract, or ask someone to do it for you
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Create a settings file**
   - Copy the file `env.example` and rename it to `.env`
   - Open `.env` in any text editor
   - Add your API keys (see "Getting API Keys" below)

4. **Start the website**
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

5. **Open your browser**
   - Go to `http://localhost:8000`
   - Enjoy your daily digest!

---

## 📱 Using the Website

### Home Page
The home page shows you **today's digest** with:
- **TL;DR section**: A quick 2-3 sentence summary of the day's news
- **Organized sections**: News grouped by country (Egypt 🇪🇬, Saudi Arabia 🇸🇦, UAE 🇦🇪) and topics (Logistics 🚢, Policy 📋)
- **Clickable headlines**: Click any article to read the full story

### Archive Page
- Browse **past digests** going back 30 days
- Click any card to view that day's full digest
- Perfect for catching up on news you missed

### About Page
- Learn more about how the service works
- Understand what sources we use
- See our coverage areas and topics

---

## 🔑 Getting API Keys (Optional but Recommended)

To get the best AI summaries, you'll need API keys from AI providers. Don't worry - it's free to get started!

### Anthropic (Claude) - Recommended

1. Go to https://console.anthropic.com
2. Sign up for a free account
3. Go to "API Keys" and create a new key
4. Copy the key and paste it into your `.env` file as `ANTHROPIC_API_KEY=your-key-here`

**Cost**: ~$0.01-0.05 per digest (very affordable!)

### OpenAI (Backup)

1. Go to https://platform.openai.com
2. Sign up and go to "API Keys"
3. Create a new key
4. Add it to `.env` as `OPENAI_API_KEY=your-key-here`

---

## ⚙️ Configuration (Simple)

All settings are in the `.env` file. Here are the important ones:

```env
# Required: AI API Keys (get at least one)
ANTHROPIC_API_KEY=sk-ant-xxx...
OPENAI_API_KEY=sk-xxx...

# Email Delivery (optional)
SENDGRID_API_KEY=your-key
EMAIL_TO=your-email@example.com

# Schedule (when to generate digest)
DIGEST_SCHEDULE_HOUR=8
DIGEST_SCHEDULE_MINUTE=30
TIMEZONE=Africa/Cairo
```

---

## 📊 What Sources Do We Use?

We automatically collect news from:

- **Reuters** - International news about the Middle East
- **Al Ahram Business** - Egyptian business news
- **Daily News Egypt** - Egyptian general news
- **Arab News** - Saudi Arabia news
- **The National UAE** - UAE news
- And more!

All sources are reputable, established news organizations.

---

## 🎯 What Topics Are Covered?

- 🚢 **Logistics & Shipping** - Suez Canal, ports, maritime trade
- 📋 **Policy & Regulation** - Government decisions, new laws, regulations
- 💼 **Business & Economy** - Markets, investments, companies
- 🌍 **General News** - Politics, society, regional events

---

## 🛠️ For Technical Users

### Architecture

```
Sources → Ingestors → Processors → AI Summarizer → Website
```

- **Backend**: FastAPI, Python 3.11+
- **Frontend**: Pure HTML/CSS/JavaScript (no frameworks!)
- **Database**: SQLite (dev) / PostgreSQL (production)
- **AI**: Anthropic Claude 3.5 Sonnet or OpenAI GPT-4
- **Scheduling**: APScheduler for daily automation

### API Endpoints

- `GET /` - Web interface (home page)
- `GET /archive` - Archive page
- `GET /about` - About page
- `GET /latest?format=json` - Get latest digest as JSON
- `GET /digests` - List recent digests
- `GET /health` - Health check
- `POST /run` - Manually trigger digest generation
- `GET /api` - API documentation

### Running in Production

**Docker:**
```bash
docker build -t mena-digest .
docker run -p 8000:8000 --env-file .env mena-digest
```

**Systemd Service:**
```bash
# Ask your system administrator to set this up
```

### Development

```bash
# Install dev dependencies
pip install -r requirements.txt

# Run tests
pytest

# Run with hot reload
make dev
```

---

## 📖 Common Questions

**Q: Is this free?**
A: Yes! The website is free to use. You only pay for AI API calls (about $0.01-0.05 per digest).

**Q: Do I need to know how to code?**
A: No! Just open the website in your browser. Setup requires minimal technical knowledge.

**Q: Can I customize what news sources are used?**
A: Yes! Edit the `sources.yaml` file to add or remove news sources.

**Q: How accurate are the summaries?**
A: Very accurate! We use state-of-the-art AI models (Claude 3.5 Sonnet) that are trained to summarize accurately.

**Q: Can I get the digest via email?**
A: Yes! Just add your email settings to the `.env` file.

**Q: Does this work on mobile?**
A: Yes! The website is fully responsive and works great on phones and tablets.

**Q: Where is my data stored?**
A: Everything is stored locally on your server in a SQLite database. We don't send your data anywhere.

---

## 🎨 Features

- ✅ Beautiful, modern web interface
- ✅ Mobile-friendly responsive design
- ✅ No ads or tracking
- ✅ Fast and lightweight
- ✅ Daily automatic updates
- ✅ AI-powered summaries
- ✅ Multi-source aggregation
- ✅ Smart deduplication
- ✅ Email delivery option
- ✅ WhatsApp & Telegram support
- ✅ Archive of past digests
- ✅ Open source

---

## 🤝 Contributing

This is an open-source project! We welcome contributions.

---

## 📄 License

MIT License - feel free to use and modify!

---

## 💬 Support

Having trouble? Check the documentation or open an issue on GitHub.

---

**Made with ❤️ for the MENA community**

Stay informed. Stay ahead. Stay connected.
