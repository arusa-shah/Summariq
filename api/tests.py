import tempfile
from io import BytesIO
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

User = get_user_model()

class SummarIQAPITests(APITestCase):
    def setUp(self):
        self.signup_url = reverse('signup')
        self.login_url = reverse('login')
        self.upload_url = reverse('upload')
        self.email_url = reverse('email-summary')
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='testpass123')

    def test_signup_and_login(self):
        # Signup
        resp = self.client.post(self.signup_url, {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'newpass123',
            'password2': 'newpass123',
        })
        self.assertEqual(resp.status_code, 201)
        # Login
        resp = self.client.post(self.login_url, {
            'username': 'newuser',
            'password': 'newpass123',
        })
        self.assertIn('access', resp.data)

    @patch('api.views.summarize_chunk', return_value='Summary bullet point 1\nSummary bullet point 2')
    def test_upload_pdf_and_email(self, mock_summarize):
        self.client.force_authenticate(user=self.user)
        # Create a fake PDF file
        from reportlab.pdfgen import canvas
        pdf_buffer = BytesIO()
        c = canvas.Canvas(pdf_buffer)
        c.drawString(100, 750, "This is a test PDF.")
        c.save()
        pdf_buffer.seek(0)
        pdf_file = tempfile.NamedTemporaryFile(suffix='.pdf')
        pdf_file.write(pdf_buffer.read())
        pdf_file.seek(0)
        pdf_file.flush()
        with open(pdf_file.name, 'rb') as f:
            resp = self.client.post(self.upload_url, {'file': f}, format='multipart')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('summary', resp.data)
        # Test email summary
        with patch('api.views.EmailMessage.send') as mock_send:
            resp = self.client.post(self.email_url, {'email': 'dest@example.com', 'summary': 'Test summary'}, format='json')
            self.assertEqual(resp.status_code, 200)
            mock_send.assert_called_once()
