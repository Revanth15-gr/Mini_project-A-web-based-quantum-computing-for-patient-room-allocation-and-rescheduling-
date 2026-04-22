"""
Email notification service for emergency allocations
Supports both actual email sending and mock notifications
"""

import json
from datetime import datetime
from pathlib import Path

# Mock email log file for development
MOCK_EMAIL_LOG = Path(__file__).parent.parent / 'logs' / 'emergency_emails.log'


def log_email(hospital_name, patient_name, severity, location, distance_km):
    """Log email notifications for audit trail"""
    MOCK_EMAIL_LOG.parent.mkdir(exist_ok=True)
    
    email_record = {
        'timestamp': datetime.now().isoformat(),
        'hospital': hospital_name,
        'patient': patient_name,
        'severity': severity,
        'location': location,
        'distance_km': distance_km,
        'status': 'sent'
    }
    
    try:
        with open(MOCK_EMAIL_LOG, 'a') as f:
            f.write(json.dumps(email_record) + '\n')
    except Exception as e:
        print(f"Error logging email: {e}")


def send_email_notification(hospital_name, hospital_email, patient_name, severity, location, distance_km):
    """
    Send email notification to assigned hospital.
    
    In production, configure SMTP settings in environment variables:
    - EMAIL_SENDER
    - EMAIL_PASSWORD
    - SMTP_SERVER
    - SMTP_PORT
    
    Args:
        hospital_name: Name of the hospital
        hospital_email: Email address of hospital admin
        patient_name: Name of the patient
        severity: Severity level (Critical, High, Medium, Low)
        location: Emergency location
        distance_km: Distance to hospital
    
    Returns:
        Boolean indicating success
    """
    
    # Gmail-friendly concise email content
    subject = f"Emergency Alert: {severity.upper()} Trauma Case - Immediate Response Needed"

    message_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937; margin: 0; padding: 16px;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
            <h2 style="margin: 0 0 12px; color: #b91c1c;">Emergency Alert - Critical Case</h2>
            <p style="margin: 0 0 12px;">Dear Doctor / Medical Staff,</p>
            <p style="margin: 0 0 12px;">A critical trauma case has been reported and requires immediate attention.</p>

            <table style="width: 100%; border-collapse: collapse; margin: 0 0 12px;">
                <tr>
                    <td style="padding: 6px 0; font-weight: 700; width: 180px;">Case Type:</td>
                    <td style="padding: 6px 0;">Road Accident / Trauma</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; font-weight: 700;">Condition:</td>
                    <td style="padding: 6px 0;">{severity.upper()}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; font-weight: 700;">Priority Level:</td>
                    <td style="padding: 6px 0;">High</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; font-weight: 700;">Location:</td>
                    <td style="padding: 6px 0;">{location}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; font-weight: 700;">Hospital:</td>
                    <td style="padding: 6px 0;">{hospital_name}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; font-weight: 700;">Time:</td>
                    <td style="padding: 6px 0;">{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</td>
                </tr>
            </table>

            <p style="margin: 0 0 12px;">All available doctors, especially specialists, are requested to report to the Emergency Department without delay.</p>
            <p style="margin: 0 0 12px; font-weight: 700; color: #b91c1c;">Please acknowledge and proceed immediately.</p>
            <p style="margin: 0; color: #6b7280; font-size: 12px;">Hospital Emergency Alert System</p>
        </div>
    </body>
    </html>
    """
    
    # Log the email (for audit trail and development)
    log_email(hospital_name, patient_name, severity, location, distance_km)
    
    # In production, actually send the email here using smtplib or a service like SendGrid
    # For now, we'll just log it
    print(f"Email notification logged for {hospital_name}: {subject}")
    
    return True


def send_sms_notification(hospital_phone, patient_name, severity, location):
    """
    Send SMS notification to hospital (requires Twilio or similar service).
    
    Args:
        hospital_phone: Phone number of hospital admin
        patient_name: Name of the patient
        severity: Severity level
        location: Emergency location
    
    Returns:
        Boolean indicating success
    """
    sms_text = f"🚑 EMERGENCY: {severity} patient {patient_name} at {location} assigned to your hospital"
    
    # Log SMS notification
    print(f"SMS notification queued to {hospital_phone}: {sms_text}")
    
    # In production, integrate with Twilio API here
    return True
