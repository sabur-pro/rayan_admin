'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, Trash2, X, Loader2, Pencil, ShieldCheck, ShieldOff } from 'lucide-react';
import { getSellers, createSeller, updateSeller, deleteSeller } from '@/lib/seller';
import type { Seller } from '../../../../../types/seller';

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newLogin, setNewLogin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newCanCreateBanner, setNewCanCreateBanner] = useState(false);

  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [editName, setEditName] = useState('');
  const [editLogin, setEditLogin] = useState('');
  const [editCanCreateBanner, setEditCanCreateBanner] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadSellers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSellers(page, limit);
      setSellers(res.data || []);
      setTotalCount(res.total_count);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    loadSellers();
  }, [loadSellers]);

  const handleCreate = async () => {
    if (!newLogin || !newPassword) return;
    setCreating(true);
    try {
      await createSeller({
        login: newLogin,
        password: newPassword,
        name: newName,
        can_create_banner: newCanCreateBanner,
      });
      setShowCreateModal(false);
      setNewLogin('');
      setNewPassword('');
      setNewName('');
      setNewCanCreateBanner(false);
      loadSellers();
    } catch (err) {
      alert('Ошибка: ' + (err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (seller: Seller) => {
    setEditingSeller(seller);
    setEditLogin(seller.login);
    setEditName(seller.name);
    setEditCanCreateBanner(seller.can_create_banner);
  };

  const handleUpdate = async () => {
    if (!editingSeller) return;
    setUpdating(true);
    try {
      await updateSeller(editingSeller.id, {
        login: editLogin,
        name: editName,
        can_create_banner: editCanCreateBanner,
      });
      setEditingSeller(null);
      loadSellers();
    } catch (err) {
      alert('Ошибка: ' + (err as Error).message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить продавца?')) return;
    setDeletingId(id);
    try {
      await deleteSeller(id);
      loadSellers();
    } catch (err) {
      alert('Ошибка: ' + (err as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Users className="h-8 w-8" />
            Продавцы
          </h1>
          <p className="text-muted-foreground">Управление продавцами магазина</p>
        </div>
        <Button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить продавца
        </Button>
      </div>

      {loading && <div className="text-center py-12 text-muted-foreground">Загрузка...</div>}
      {error && <div className="text-center py-12 text-destructive">{error}</div>}

      {!loading && !error && sellers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">Продавцы не найдены</div>
      )}

      <Card className="glass">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Логин</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Имя</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Создание баннеров</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Создан</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm">{seller.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{seller.login}</td>
                    <td className="px-4 py-3 text-sm">{seller.name || '—'}</td>
                    <td className="px-4 py-3 text-sm">
                      {seller.can_create_banner ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-600 rounded-full text-xs">
                          <ShieldCheck className="h-3 w-3" />
                          Разрешено
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-600 rounded-full text-xs">
                          <ShieldOff className="h-3 w-3" />
                          Запрещено
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(seller.created_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(seller)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(seller.id)}
                          disabled={deletingId === seller.id}
                          className="p-2 hover:bg-red-500/10 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {deletingId === seller.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {totalCount > limit && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline px-3 py-1 rounded disabled:opacity-50">‹</button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-outline px-3 py-1 rounded disabled:opacity-50">›</button>
        </div>
      )}

      {/* Модальное окно создания */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <Card className="w-full max-w-md animate-in" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Новый продавец</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Логин *</label>
                  <Input value={newLogin} onChange={(e) => setNewLogin(e.target.value)} placeholder="Логин для входа" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Пароль *</label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Пароль" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Имя</label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Имя продавца" />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCanCreateBanner}
                    onChange={(e) => setNewCanCreateBanner(e.target.checked)}
                    className="w-4 h-4 rounded border-2 accent-primary"
                  />
                  <span className="text-sm">Может создавать баннеры</span>
                </label>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1 btn-outline" onClick={() => setShowCreateModal(false)}>
                    Отмена
                  </Button>
                  <Button className="flex-1 btn-primary" onClick={handleCreate} disabled={!newLogin || !newPassword || creating}>
                    {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Создание...</> : 'Создать'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Модальное окно редактирования */}
      {editingSeller && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4" onClick={() => setEditingSeller(null)}>
          <Card className="w-full max-w-md animate-in" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Редактирование</h2>
                <button onClick={() => setEditingSeller(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Логин</label>
                  <Input value={editLogin} onChange={(e) => setEditLogin(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Имя</label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editCanCreateBanner}
                    onChange={(e) => setEditCanCreateBanner(e.target.checked)}
                    className="w-4 h-4 rounded border-2 accent-primary"
                  />
                  <span className="text-sm">Может создавать баннеры</span>
                </label>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1 btn-outline" onClick={() => setEditingSeller(null)}>
                    Отмена
                  </Button>
                  <Button className="flex-1 btn-primary" onClick={handleUpdate} disabled={updating}>
                    {updating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Сохранение...</> : 'Сохранить'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
