# Heartwork Backend

Backend server for the Heartwork application, providing API endpoints, Socket.io real-time updates, and push notification capabilities.

## Features

- User authentication with JWT
- RESTful API endpoints for sticky notes, gallery images, and to-do lists
- Real-time updates via Socket.io
- Mobile push notifications via Web Push API
- Cloudinary integration for image hosting

## Mobile Push Notifications

The server now supports mobile push notifications, allowing users to receive alerts on their mobile devices even when the browser is closed.

### Setup Instructions

1. **Install Web Push Library**:
   ```bash
   npm install web-push --save
   ```

2. **Generate VAPID Keys**:
   ```bash
   node scripts/generate-vapid-keys.js
   ```
   This will output VAPID keys that need to be added to your environment variables.

3. **Set Environment Variables**:
   Create a `.env` file in the project root with:
   ```
   VAPID_PUBLIC_KEY=your_public_key
   VAPID_PRIVATE_KEY=your_private_key
   VAPID_SUBJECT=mailto:your-email@example.com
   ```
   Also share the public key with the frontend by setting `REACT_APP_VAPID_PUBLIC_KEY` in the frontend's `.env` file.

4. **User Permissions**:
   Users need to subscribe to push notifications through the frontend interface. Subscriptions are stored in the user model.

## Development

### Installation

```bash
npm install
```

### Running the development server

```bash
npm run dev
```

### VAPID Key Generation

To generate new VAPID keys for Web Push:

```bash
node scripts/generate-vapid-keys.js
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/user` - Get current user info

### Notes
- `GET /api/notes` - Get all notes
- `POST /api/notes` - Create a new note
- `PUT /api/notes/:id` - Update a note
- `DELETE /api/notes/:id` - Delete a note

### Gallery
- `GET /api/gallery/images` - Get all images
- `POST /api/gallery/upload` - Upload a new image
- `DELETE /api/gallery/images/:id` - Delete an image

### To-Do Lists
- `GET /api/todos` - Get all to-do lists
- `POST /api/todos` - Create a new to-do list
- `PUT /api/todos/:id` - Update a to-do list
- `DELETE /api/todos/:id` - Delete a to-do list

### Push Notifications
- `GET /api/notifications/vapid-public-key` - Get the VAPID public key
- `POST /api/notifications/subscribe` - Subscribe to push notifications
- `POST /api/notifications/unsubscribe` - Unsubscribe from push notifications

## Environment Variables

Create a `.env` file with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/heartwork
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:3000

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:your-email@example.com
```

## Technologies Used

- Node.js
- Express
- MongoDB with Mongoose
- Socket.io
- Web Push
- Cloudinary
- JWT Authentication 