'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { authApi } from '@/lib/api-client';
import { setAuthCookie } from '@/lib/cookies';
import { LoginRequest } from '../../../types/auth';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<LoginRequest>({
    login: '',
    password: '',
    // role: 'admin',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authApi.login(formData);
      setAuthCookie('ACCESS_TOKEN', response.access_token, response.expires_in);
      setAuthCookie('REFRESH_TOKEN', response.refresh_token);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass shadow-2xl animate-in">
        <CardHeader className="space-y-1 text-center">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-xl">R</span>
          </div>
          <CardTitle className="text-2xl text-foreground">Вход в систему</CardTitle>
          <CardDescription className="text-muted-foreground">
            Введите свои учетные данные для доступа к панели управления
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                name="login"
                placeholder="Логин"
                value={formData.login}
                onChange={handleChange}
                required
                className="py-2 px-4"
              />
            </div>
            <div className="space-y-2">
              <Input
                name="password"
                type="password"
                placeholder="Пароль"
                value={formData.password}
                onChange={handleChange}
                required
                className="py-2 px-4"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full btn-primary py-2" 
              disabled={isLoading}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">
              Вернуться на главную
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}