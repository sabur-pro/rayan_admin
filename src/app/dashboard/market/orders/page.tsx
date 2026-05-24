'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ClipboardList, ArrowLeft, Loader2, Package, Truck,
  CheckCircle2, XCircle, Clock, ChevronDown, Phone, MessageSquare,
  MapPin, CreditCard, Banknote
} from 'lucide-react';
import { getOrders, updateOrderStatus } from '@/lib/order';
import { getDeliveryCost, updateDeliveryCost } from '@/lib/setting';
import { getRoleFromToken } from '@/lib/auth-utils';
import { Input } from '@/components/ui/input';
import type { Order, OrderItem } from '../../../../../types/order';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending:    { label: 'Ожидает',      color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800', icon: Clock },
  accepted:   { label: 'Принят',       color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800', icon: Package },
  delivering: { label: 'Доставляется', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800', icon: Truck },
  completed:  { label: 'Выполнен',     color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800', icon: CheckCircle2 },
  rejected:   { label: 'Отказан',      color: 'text-red-600',    bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800', icon: XCircle },
};

const STATUS_FLOW = ['pending', 'accepted', 'delivering', 'completed', 'rejected'];

type FilterTab = 'all' | 'pending' | 'accepted' | 'delivering' | 'completed' | 'rejected';

export default function OrdersPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [statusDropdown, setStatusDropdown] = useState<number | null>(null);

  // Delivery cost (global setting)
  const [deliveryCost, setDeliveryCost] = useState<string>('');
  const [savingDelivery, setSavingDelivery] = useState(false);
  const [deliverySaved, setDeliverySaved] = useState(false);

  const LIMIT = 20;

  useEffect(() => {
    setRole(getRoleFromToken());
    getDeliveryCost().then(c => setDeliveryCost(String(c))).catch(() => {});
  }, []);

  const handleSaveDelivery = async () => {
    setSavingDelivery(true);
    setDeliverySaved(false);
    try {
      await updateDeliveryCost(Number(deliveryCost) || 0);
      setDeliverySaved(true);
      setTimeout(() => setDeliverySaved(false), 2000);
    } catch (err) {
      alert('Ошибка: ' + (err as Error).message);
    } finally {
      setSavingDelivery(false);
    }
  };

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = activeFilter === 'all' ? undefined : activeFilter;
      const res = await getOrders(page, LIMIT, status);
      setOrders(res.data || []);
      setTotal(res.total_count);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, activeFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    setPage(1);
  }, [activeFilter]);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setUpdatingId(orderId);
    setStatusDropdown(null);
    try {
      await updateOrderStatus(orderId, newStatus);
      loadOrders();
    } catch (err) {
      alert('Ошибка: ' + (err as Error).message);
    } finally {
      setUpdatingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getStatusConfig = (status: string) => STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" className="btn-outline" onClick={() => router.push('/dashboard/market')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ClipboardList className="h-8 w-8" />Заказы
            </h1>
            <p className="text-muted-foreground">
              {total} {total === 1 ? 'заказ' : total < 5 ? 'заказа' : 'заказов'}
            </p>
          </div>
        </div>

        {role === 'admin' && (
          <Card>
            <CardContent className="p-3 flex items-end gap-2">
              <div>
                <label className="text-xs font-medium mb-1 flex items-center gap-1 text-muted-foreground">
                  <Truck className="h-3.5 w-3.5" />Стоимость доставки (сом.)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={deliveryCost}
                  onChange={e => setDeliveryCost(e.target.value)}
                  className="w-40"
                  placeholder="0"
                />
              </div>
              <Button className="btn-primary" onClick={handleSaveDelivery} disabled={savingDelivery}>
                {savingDelivery ? <Loader2 className="h-4 w-4 animate-spin" /> : deliverySaved ? '✓ Сохранено' : 'Сохранить'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg overflow-x-auto">
        {(['all', ...STATUS_FLOW] as FilterTab[]).map(tab => {
          const cfg = tab === 'all' ? null : STATUS_CONFIG[tab];
          const label = tab === 'all' ? 'Все' : cfg?.label || tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeFilter === tab
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              {cfg && <cfg.icon className="h-3.5 w-3.5" />}
              {label}
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {loading && (
        <div className="text-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />Загрузка...
        </div>
      )}
      {error && <div className="text-center py-16 text-destructive">{error}</div>}
      {!loading && !error && orders.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
          Заказы не найдены
        </div>
      )}

      <div className="space-y-3">
        {orders.map(order => {
          const cfg = getStatusConfig(order.status);
          const StatusIcon = cfg.icon;
          const isExpanded = expandedOrder === order.id;

          return (
            <Card key={order.id} className={`border transition-all ${cfg.bg}`}>
              <CardContent className="p-0">
                {/* Order Header */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className={`p-2.5 rounded-xl ${cfg.bg}`}>
                    <StatusIcon className={`h-5 w-5 ${cfg.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-lg">#{order.id}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span>{formatDate(order.created_at)}</span>
                      {order.user_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />{order.user_phone}
                        </span>
                      )}
                      <span>{order.items?.length || 0} товар(ов)</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-bold">{(order.total_price + (order.delivery_cost || 0)).toFixed(2)} с.</div>
                    {order.delivery_cost > 0 && (
                      <div className="text-xs text-muted-foreground mt-0.5">вкл. доставку {order.delivery_cost.toFixed(2)} с.</div>
                    )}
                    {role === 'admin' && (
                      <div className="text-xs text-green-600 font-medium mt-0.5">
                        +{order.profit.toFixed(2)} прибыль
                      </div>
                    )}
                  </div>

                  {/* Status Changer */}
                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="btn-outline"
                      disabled={updatingId === order.id}
                      onClick={() => setStatusDropdown(statusDropdown === order.id ? null : order.id)}
                    >
                      {updatingId === order.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>Статус <ChevronDown className="h-3.5 w-3.5 ml-1" /></>
                      )}
                    </Button>

                    {statusDropdown === order.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setStatusDropdown(null)} />
                        <div className="absolute right-0 top-full mt-1 z-50 bg-popover border rounded-lg shadow-lg py-1 min-w-[180px]">
                          {STATUS_FLOW.map(s => {
                            const sc = STATUS_CONFIG[s];
                            const Icon = sc.icon;
                            return (
                              <button
                                key={s}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors ${
                                  order.status === s ? 'font-bold bg-muted/50' : ''
                                }`}
                                onClick={() => handleStatusChange(order.id, s)}
                              >
                                <Icon className={`h-4 w-4 ${sc.color}`} />
                                <span className={sc.color}>{sc.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t px-4 pb-4 pt-3 space-y-3">
                    {/* Delivery / contact info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm bg-muted/50 rounded-lg p-3">
                      {order.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>{order.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {order.payment_method === 'card' ? (
                          <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <Banknote className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span>{order.payment_method === 'card' ? 'Оплата картой (безнал)' : 'Оплата наличными'}</span>
                      </div>
                      {order.address && (
                        <div className="flex items-start gap-2 sm:col-span-2">
                          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                          <span>{order.address}</span>
                        </div>
                      )}
                    </div>

                    {order.comment && (
                      <div className="flex items-start gap-2 text-sm bg-muted/50 rounded-lg p-3">
                        <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <span>{order.comment}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      {(order.items || []).map((item: OrderItem) => (
                        <div key={item.id} className="flex items-center gap-3 bg-background/60 rounded-lg p-3 border">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-12 rounded-lg object-cover bg-muted"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.price.toFixed(2)} с. × {item.quantity} шт.
                            </p>
                            {role === 'admin' && (
                              <p className="text-xs text-muted-foreground">
                                Себест.: {item.cost_price.toFixed(2)} с.
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">
                              {(item.price * item.quantity).toFixed(2)} с.
                            </div>
                            {role === 'admin' && (
                              <div className="text-xs text-green-600">
                                +{((item.price - item.cost_price) * item.quantity).toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totals breakdown */}
                    <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Сумма товаров</span>
                        <span className="font-medium">{order.total_price.toFixed(2)} с.</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Доставка</span>
                        <span className="font-medium">{order.delivery_cost > 0 ? `${order.delivery_cost.toFixed(2)} с.` : 'Бесплатно'}</span>
                      </div>
                      <div className="flex items-center justify-between border-t pt-1 mt-1">
                        <span className="font-semibold">Итого</span>
                        <span className="font-bold">{(order.total_price + (order.delivery_cost || 0)).toFixed(2)} с.</span>
                      </div>
                    </div>

                    {role === 'admin' && (
                      <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3 text-sm">
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Себестоимость: <span className="font-medium text-foreground">{order.total_cost_price.toFixed(2)} с.</span></p>
                          <p className="text-muted-foreground">Продажа: <span className="font-medium text-foreground">{order.total_price.toFixed(2)} с.</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Прибыль</p>
                          <p className="text-lg font-bold text-green-600">+{order.profit.toFixed(2)} с.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-outline px-3 py-1.5 rounded-lg text-sm disabled:opacity-50"
          >
            ‹
          </button>
          <span className="text-sm text-muted-foreground px-2">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-outline px-3 py-1.5 rounded-lg text-sm disabled:opacity-50"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
