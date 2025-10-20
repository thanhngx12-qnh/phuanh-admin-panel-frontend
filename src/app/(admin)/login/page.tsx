// src/app/(admin)/login/page.tsx
import { LoginForm } from './_components/LoginForm';

export default function LoginPage() {
  return (
    <main style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f0f2f5' // Màu nền nhẹ giống của Ant Design
    }}>
      <LoginForm />
    </main>
  );
}