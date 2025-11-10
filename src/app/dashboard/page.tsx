import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Building2, Users, TrendingUp } from 'lucide-react';

const stats = [
  {
    title: "Всего пользователей",
    value: "1,234",
    icon: Users,
    change: "+12%",
    changeType: "positive" as const,
  },
  {
    title: "Университетов",
    value: "56",
    icon: Building2,
    change: "+3%",
    changeType: "positive" as const,
  },
  {
    title: "Активных сессий",
    value: "89",
    icon: BarChart3,
    change: "-2%",
    changeType: "negative" as const,
  },
  {
    title: "Общий трафик",
    value: "12.5K",
    icon: TrendingUp,
    change: "+24%",
    changeType: "positive" as const,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Дашборд</h1>
        <p className="text-muted-foreground">Обзор статистики и активности системы</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.changeType === "positive";
          
          return (
            <Card key={index} className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '↑' : '↓'} {stat.change} с прошлого месяца
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Активность пользователей</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              График активности будет здесь
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Последние действия</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Новый пользователь зарегистрирован</p>
                    <p className="text-xs text-muted-foreground">2 часа назад</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}