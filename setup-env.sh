#!/bin/bash

# Setup script for Tiket project
echo "Setting up Tiket project environment..."

# Create .env.local file
cat > .env.local << 'EOL'
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCGiiy5smPnTFY7RdhsHfe12briESgTr4k
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tiket-9268c.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tiket-9268c
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tiket-9268c.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=653453593991
NEXT_PUBLIC_FIREBASE_APP_ID=1:653453593991:web:67009ebea86a870f735722
REPLICATE_API_KEY=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
OPENROUTER_MODEL=openrouter/anthropic/claude-3.5-sonnet
GOOGLE_APPLICATION_CREDENTIALS=./creds.json
GEMINI_API_KEY=AIzaSyC5MY27mvbNmWi_hN4X06f8cyYnazw1Idc
EOL

# Create creds.json file
cat > creds.json << 'EOL'
{
  "type": "service_account",
  "project_id": "peerless-garage-475520-e0",
  "private_key_id": "742c1d73dcc2ad682da00e2d7ceb2fcb8b6e5c6c",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC98THGXXsp1NNm\nMmgc7MlVRioSsXI6rJq4F0OAVTCrx7sJQN3bwg1m4AAfUucA5BeMByjWzfGO1muY\nzDchB+rxyxQBAp5/mwyBMgB8k7QYUA+3bNRopyjpJXbbfsGjRn5jdOaR/zZEEAJr\nzh+akOqsVTmvMIsp/w6lsYKCG2vO700ghBdIWb4v/ljZR8/Mpn+ecCI1RYEA+fa8\nOZWPB70XdDATEvtHefo1l346ZUZrJ9SuGhfgWSyzmEjla5xh8VViMM9sNTuUwk6r\nZlNNKRToiX584vAhSy3acBeQXO2I80QZ3n7KP1coHSQM5IK38MSckKttxcXxvjX0\n6Y4zip/tAgMBAAECggEAQiKQJTR5ZOhQrx3P+HpN494pWhbk4h8lRAH9o9qFtto1\nepRWa2UWy4IlKMLx4fKJbF010A0nFYf9MNeyPlMGcCg4j918mIvA/98MIlQ/edOu\nlTxUfRfu+7bquqRZAePSsAiNG7qUB4DXhvffMy9QNq76BdDOM9I2JGU5PtoTYJqC\nViAxmVk045E6+QIMvb6ltaXkqJNn3AWlsuQ9awcDHxK/eM6Jho3VjwFPdIyeaRc/\njjsDCM8DCwJSbpEwpTW68j/xn9vO62OU4wp8XxuxRYZpPEetFf+31Dqh6uP3Dsfs\nC/Ua3VhNYY/IYjuv1OX5LBLOPbHxwui0lL1iS2NcVQKBgQDg+6OxL7rMcZU8plj3\n29Cyjis6dfn+K669l6HbMXeofFkSlcbAk0hbgFHUnQ/BZp/IYWAAVhGfEUID5kc9\n3eRUwcUzEecy6D5z711cflWMtQxO5pMqLsvyZ7rli+jzhS6KapEuTwoH0u116ErU\nkQuZBm5oA6TlLzc426NBSGIbwwKBgQDYINqz6hOa6dZAQ7Roc5AD9vP1cKaohfXo\ncM1ZmdvOIQC4/0Q84/hnONuj9kC4dXOiSeS4WfABB5fTp7gEM1yNelhiHlu8A59w\nLA+ctwT62qELKda697/jPGGue7WYcscmh7h9I1Gj5qhWlKbwqUJI7EKdVpVVmsBv\nKmrOSMKKjwKBgA/RobDTqk61rciV6auDySjE1kVGBk3YxHCQONEwqTkvhRPJdDAW\nKwBEBXztji4LCTENp7JeWt7UV8/uYRP4hhVvim4M1DTAH6QHMIlQWLOMB1GE5NQS\ndkSVBo8dR0PYGW2iEJMw+4ORUSD5NEm96RLZYOnvV6jFqRxWVSRB8qQBAoGBALW7\ncorkIdYaGAjzpUhLG+bpiZtxPQHpmqv35gQYpsX95ECqjHNy8dXB7pZBI4y3XiMx\nZTxKi9Ah1V2o4sfNdF6WaKkgg9xlY3SL6BjLoEla+x2K8b9HQbfOdwijh0AIC0Nv\nzgaTYzuhYR1kY7dra4wr9ZudSXaw6GzRSvvoHIUrAoGAILrjekZRjOALP02QQOEc\nGN7wv7UChODOcUAI/eJpQ6ApqRK8AoseE4Hfj3zcYstxw72N4hAP8/k4eMmGWPCR\ndalsA/8nqYtuTxozgB7R1uSlL0DztfB0q8/KANt2+DGU5CgrQJaK2xgd8L2I6JAZ\nNkE2FaiZ6jc6BbhT10ASCL8=\n-----END PRIVATE KEY-----\n",
  "client_email": "tiket-471@peerless-garage-475520-e0.iam.gserviceaccount.com",
  "client_id": "111894921971752616121",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/tiket-471%40peerless-garage-475520-e0.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
EOL

echo "✅ .env.local created"
echo "✅ creds.json created"
echo ""
echo "Now run: npm install && npm run dev"
