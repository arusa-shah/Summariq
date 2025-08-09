# SummarIQ Deployment Instructions

## Backend (Django)

### 1. Install dependencies
```
pip install -r requirements.txt
```

### 2. Set up environment variables
Create a `.env` file in your project root (or set these in your environment):
```
EMAIL_HOST_USER=your_gmail_address@gmail.com
EMAIL_HOST_PASSWORD=your_gmail_app_password
GROQ_API_KEY=your_groq_api_key
```

You can load these automatically with [django-environ](https://github.com/joke2k/django-environ) or set them in your shell before running the server.

### 3. Run migrations
```
python manage.py makemigrations
python manage.py migrate
```

### 4. Start the server
```
python manage.py runserver
```

---

## Frontend (React)

### 1. Install dependencies
```
cd frontend
npm install
```

### 2. Start the development server
```
npm start
```

---

## Notes
- For production, use a real domain and secure your environment variables.
- For email, you must use a Gmail App Password (not your regular password). See [Google App Passwords](https://support.google.com/accounts/answer/185833?hl=en).
- For Groq API, sign up and get your API key from their dashboard.
- You can switch to SendGrid, Mailgun, or another provider by changing the Django email settings. 