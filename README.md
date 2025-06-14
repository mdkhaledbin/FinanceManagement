# Finance Management System

A full-stack finance management application built with Next.js and Django.

## Project Structure

```
FinanceManagement/
├── frontend350/          # Next.js frontend application
├── expense_backend/      # Django backend application
├── package-lock.json     # Node.js dependencies lock file
├── .gitignore           # Git ignore rules
└── LICENSE              # Project license file
```

## Prerequisites

- Node.js (v18 or higher)
- Python (3.9 or higher)
- Git

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd expense_backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows
   .\venv\Scripts\activate
   # On Unix or MacOS
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run migrations:
   ```bash
   python manage.py migrate
   ```

5. Start the development server:
   ```bash
   python manage.py runserver
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend350
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`

## Features

- User authentication and authorization
- Expense tracking and management
- Real-time data updates
- Responsive design for all devices

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the terms of the license included in the LICENSE file.

## Contact

For any questions or concerns, please open an issue in the repository.

