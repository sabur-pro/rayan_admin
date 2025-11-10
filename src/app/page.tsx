import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="glass rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 animate-in">
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">R</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-foreground">Rayan Admin</h1>
          <p className="text-muted-foreground">Панель управления для администратора</p>
        </div>
        
        <div className="space-y-3">
          <Link href="/login" className="block">
            <Button className="w-full btn-primary py-3 text-lg">
              Войти в систему
            </Button>
          </Link>
          
          <Link href="/edit" className="block">
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg">
              Создать документ
            </Button>
          </Link>
        </div>
        
        <p className="text-sm text-muted-foreground mt-6 text-center">
          Secure admin panel with modern design
        </p>
      </div>
    </div>
  );
}