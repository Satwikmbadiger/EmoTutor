
## �� Configuration

### Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication with Email/Password
4. Create a Firestore database
5. Generate a service account key and download as `firebase-key.json`
6. Update Firestore security rules:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /chats/{chatId} {
         allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
       }
     }
   }
   ```

### OpenAI API Setup
1. Get an API key from [OpenAI](https://platform.openai.com/)
2. Add it to your backend `.env` file
3. Ensure you have sufficient credits for API usage

## �� Usage

### Getting Started
1. **Sign Up/Login**: Create an account or sign in with existing credentials
2. **Upload Materials**: Click the upload area to add PDF study materials
3. **Enable Webcam**: Allow camera access for emotion detection
4. **Start Chatting**: Ask questions about your study materials
5. **View History**: Access previous conversations from the sidebar

### Features Guide

#### Emotion Detection
- The webcam automatically detects your emotional state every 5 seconds
- AI responses adapt based on detected emotions
- Webcam window is draggable and can be hidden

#### Chat Management
- **New Chat**: Start fresh conversations
- **Chat History**: View and restore previous conversations
- **Clear History**: Delete all chat history
- **Individual Deletion**: Remove specific conversations

#### File Upload
- Supports PDF documents
- Automatic processing and indexing
- Secure storage in Firebase

## 🛠️ API Endpoints

### Backend API
- `POST /api/upload-pdf` - Upload and process PDF documents
- `POST /api/ask` - Send questions to AI with emotion context
- `POST /api/detect-emotion` - Analyze webcam image for emotion detection

### Request Examples
```javascript
// Upload PDF
const formData = new FormData();
formData.append('file', pdfFile);
fetch('/api/upload-pdf', { method: 'POST', body: formData });

// Ask Question
fetch('/api/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ question: 'Your question', emotion: 'happy' })
});
```

## 🔒 Security

- **Authentication**: Firebase Authentication for user management
- **Data Protection**: Firestore security rules ensure user data isolation
- **API Security**: Backend validates all requests
- **Privacy**: User data is encrypted and stored securely

## 🎨 UI/UX Features

- **Clean Design**: Minimalistic white theme
- **Responsive Layout**: Works on all device sizes
- **ChatGPT-like Interface**: Familiar chat experience
- **Smooth Animations**: Professional transitions and effects
- **Accessibility**: Screen reader friendly with proper ARIA labels



## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## �� Acknowledgments

- OpenAI for providing the AI capabilities
- Firebase for authentication and database services
- React and Flask communities for excellent documentation
- Computer vision libraries for emotion detection

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/Emology/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## �� Version History

- **v1.0.0** - Initial release with basic chat functionality
- **v1.1.0** - Added emotion detection
- **v1.2.0** - Implemented chat history and user authentication
- **v1.3.0** - Redesigned UI with ChatGPT-like interface

## 📊 Performance

- **Frontend**: Optimized React components with lazy loading
- **Backend**: Efficient API responses with caching
- **Database**: Indexed queries for fast data retrieval
- **Emotion Detection**: Real-time processing with minimal latency

---

**Made with ❤️ by the EmoTutor Team**

*Empowering education through emotion-aware AI technology*