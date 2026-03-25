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
    
    # Email content
    subject = f"🚑 EMERGENCY ALERT: {severity.upper()} Case Assignment"
    
    message_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; background: #fff;">
            
            <div style="text-align: center; border-bottom: 2px solid #dc2626; padding-bottom: 15px; margin-bottom: 20px;">
                <h2 style="color: #dc2626; margin: 0;">🚑 EMERGENCY CASE ASSIGNED</h2>
            </div>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                <p style="margin: 0; font-weight: bold; font-size: 18px; color: #dc2626;">Severity: {severity.upper()}</p>
            </div>
            
            <div style="margin-bottom: 15px;">
                <h3 style="color: #164a8a; margin-top: 0;">Case Details:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 10px; font-weight: bold; color: #374151;">Patient Name:</td>
                        <td style="padding: 10px; color: #6b7280;">{patient_name}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 10px; font-weight: bold; color: #374151;">Severity:</td>
                        <td style="padding: 10px; color: #dc2626; font-weight: bold;">{severity.upper()}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 10px; font-weight: bold; color: #374151;">Location:</td>
                        <td style="padding: 10px; color: #6b7280;">{location}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 10px; font-weight: bold; color: #374151;">Distance to Hospital:</td>
                        <td style="padding: 10px; color: #6b7280;">{distance_km} km</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; font-weight: bold; color: #374151;">Time:</td>
                        <td style="padding: 10px; color: #6b7280;">{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</td>
                    </tr>
                </table>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 4px; margin-bottom: 15px;">
                <p style="margin: 0; font-weight: bold; color: #92400e;">⚠️ ACTION REQUIRED:</p>
                <p style="margin: 10px 0 0 0; color: #78350f;">Please prepare your Emergency Unit immediately. Patient transport ETA: {distance_km / 50 * 60:.0f} minutes (estimated).</p>
            </div>
            
            <div style="background: #f0fdf4; padding: 15px; border-left: 4px solid #15803d; border-radius: 4px;">
                <p style="margin: 0; font-weight: bold; color: #166534;">✓ Assigned Hospital:</p>
                <p style="margin: 10px 0 0 0; color: #15803d; font-size: 18px; font-weight: bold;">{hospital_name}</p>
            </div>
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
                <p style="margin: 0;">This is an automated message from the Quantum Healthcare Emergency Allocation System.</p>
                <p style="margin: 5px 0 0 0;">Do not reply to this email. For support, contact the system administrator.</p>
            </div>
            
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
