import io
import logging
import os
import tempfile

import docx
import pdfplumber
import requests
from django.conf import settings
from django.core.mail import EmailMessage, send_mail
from django.shortcuts import render
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (UserLoginSerializer, UserProfileSerializer,
                          UserSignupSerializer)

GROQ_API_KEY = settings.GROQ_API_KEY

GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
GROQ_API_KEY = os.environ.get('GROQ_API_KEY', 'YOUR_GROQ_API_KEY')
LLAMA_MODEL = 'llama-3.1-8b-instant'

# Debug: Print the API key to see if it's loaded correctly
print(f"DEBUG: GROQ_API_KEY loaded: {GROQ_API_KEY[:10]}..." if GROQ_API_KEY and GROQ_API_KEY != 'YOUR_GROQ_API_KEY' else f"DEBUG: GROQ_API_KEY is: {GROQ_API_KEY}") 

CHUNK_SIZE = 2000  
MAX_FILE_SIZE_MB = 5
ALLOWED_EXTENSIONS = ['.pdf', '.docx']

logger = logging.getLogger(__name__)

def extract_text_from_pdf(file_path):
    text = ''
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ''
    return text

def extract_text_from_docx(file_path):
    doc = docx.Document(file_path)
    return '\n'.join([p.text for p in doc.paragraphs])

def chunk_text(text, chunk_size=CHUNK_SIZE):
    return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

def summarize_chunk(chunk):
    headers = {
        'Authorization': f'Bearer {GROQ_API_KEY}',
        'Content-Type': 'application/json',
    }
    data = {
        'model': LLAMA_MODEL,
        'messages': [
            {"role": "system", "content": "Summarize the following text in concise, professional bullet points, suitable for sharing via email. Limit to the most important information."},
            {"role": "user", "content": chunk},
        ],
        'max_tokens': 512,
        'temperature': 0.3,
    }
    try:
        response = requests.post(GROQ_API_URL, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        return response.json()['choices'][0]['message']['content'], None  # Always return tuple
    except requests.exceptions.HTTPError as e:
        if e.response is not None and e.response.status_code == 429:
            print("Groq API rate limit exceeded.")
            return None, "Groq API rate limit exceeded. Please try again later."
        print(f"Groq API Error: {e}")
        return None, f"AI summarization failed: {str(e)}"
    except requests.exceptions.RequestException as e:
        print(f"Groq API Error: {e}")
        return None, f"AI summarization failed: {str(e)}"
class SignupView(APIView):
    def post(self, request):
        try:
            serializer = UserSignupSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                logger.info(f"User created successfully: {user.username}")
                return Response({'message': 'User created successfully.'}, status=status.HTTP_201_CREATED)
            else:
                logger.error(f"Signup validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Signup error: {str(e)}")
            return Response({'error': f'Signup failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoginView(TokenObtainPairView):
    serializer_class = UserLoginSerializer
    
class DocumentUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]
    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file uploaded.'}, status=400)
        ext = os.path.splitext(file_obj.name)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            return Response({'error': 'Invalid file type. Only PDF and DOCX are allowed.'}, status=400)
        if file_obj.size > MAX_FILE_SIZE_MB * 1024 * 1024:
            return Response({'error': f'File too large. Max size is {MAX_FILE_SIZE_MB}MB.'}, status=400)
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            for chunk in file_obj.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name
        try:
            if ext == '.pdf':
                text = extract_text_from_pdf(tmp_path)
            else:
                text = extract_text_from_docx(tmp_path)
        finally:
            os.remove(tmp_path)
        if not text.strip():
            return Response({'error': 'No text found in document.'}, status=400)
        chunks = chunk_text(text)
        summaries = []
        for chunk in chunks:
            summary, error = summarize_chunk(chunk)
            if error:
                return Response({'error': error}, status=429 if "rate limit" in error else 500)
            summaries.append(summary)
        final_summary = '\n'.join(summaries)
        return Response({'summary': final_summary})
    
    
class EmailSummaryView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        email = request.data.get('email')
        summary = request.data.get('summary')
        if not email or not summary:
            return Response({'error': 'Email and summary required.'}, status=400)
        # Generate PDF attachment
        pdf_buffer = io.BytesIO()
        try:
            c = canvas.Canvas(pdf_buffer, pagesize=letter)
            textobject = c.beginText(40, 750)
            for line in summary.split('\n'):
                textobject.textLine(line)
            c.drawText(textobject)
            c.showPage()
            c.save()
            pdf_buffer.seek(0)
            email_message = EmailMessage(
                subject='Your SummarIQ Document Summary',
                body='Please find your summarized document attached as a PDF.',
                from_email='no-reply@summariq.com',
                to=[email],
            )
            email_message.attach('summary.pdf', pdf_buffer.read(), 'application/pdf')
            email_message.send(fail_silently=False)
            return Response({'message': 'Summary sent via email as PDF attachment.'})
        except Exception as e:
            return Response({'error': f'Failed to generate or send PDF: {str(e)}'}, status=500)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    def put(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
