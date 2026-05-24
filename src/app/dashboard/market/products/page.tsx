'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, Plus, Trash2, Pencil, X, Loader2, Image,
  Package, Eye, EyeOff, ImagePlus
} from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct, addProductImages } from '@/lib/product';
import { getSellers } from '@/lib/seller';
import { getRoleFromToken } from '@/lib/auth-utils';
import { useAcademicData, AcademicSelectors, AcademicTags } from '@/components/AcademicSelectors';
import type { Product } from '../../../../../types/product';
import type { Seller } from '../../../../../types/seller';

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('category_id') ? Number(searchParams.get('category_id')) : undefined;
  const categoryName = searchParams.get('name') || 'Продукты';

  const [role, setRole] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allSellers, setAllSellers] = useState<Seller[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Create form
  const [cName, setCName] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cCost, setCCost] = useState('');
  const [cPrice, setCPrice] = useState('');
  const [cStock, setCStock] = useState('');
  const [cTag, setCTag] = useState('');
  const [cPriority, setCPriority] = useState('');
  const [cSellerId, setCSellerId] = useState('');
  const [cUni, setCUni] = useState('');
  const [cFac, setCFac] = useState('');
  const [cCourse, setCCourse] = useState('');
  const [cSem, setCSem] = useState('');
  const [cImages, setCImages] = useState<File[]>([]);
  const [cPreviews, setCPreviews] = useState<string[]>([]);

  // Edit form
  const [eName, setEName] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [eCost, setECost] = useState('');
  const [ePrice, setEPrice] = useState('');
  const [eStock, setEStock] = useState('');
  const [eTag, setETag] = useState('');
  const [ePriority, setEPriority] = useState('');
  const [eActive, setEActive] = useState(true);
  const [eUni, setEUni] = useState('');
  const [eFac, setEFac] = useState('');
  const [eCourse, setECourse] = useState('');
  const [eSem, setESem] = useState('');

  const LIMIT = 12;
  const academic = useAcademicData();

  useEffect(() => {
    const r = getRoleFromToken();
    setRole(r);
    if (r === 'admin') getSellers(1, 100).then(res => setAllSellers(res.data || [])).catch(() => {});
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getProducts(page, LIMIT, categoryId);
      setProducts(res.data || []);
      setTotal(res.total_count);
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }, [page, categoryId]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setCImages(prev => [...prev, ...files]);
    setCPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeImage = (idx: number) => {
    setCImages(prev => prev.filter((_, i) => i !== idx));
    setCPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCreate = async () => {
    if (!cName || !cPrice || !cCost || cImages.length === 0) return;
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append('name', cName);
      if (cDesc) fd.append('description', cDesc);
      fd.append('cost_price', cCost);
      fd.append('price', cPrice);
      if (cStock) fd.append('stock', cStock);
      if (cTag) fd.append('tag', cTag);
      if (categoryId) fd.append('category_id', String(categoryId));
      if (cPriority) fd.append('priority', cPriority);
      if (cSellerId) fd.append('seller_id', cSellerId);
      if (cUni) fd.append('university_id', cUni);
      if (cFac) fd.append('faculty_id', cFac);
      if (cCourse) fd.append('course_id', cCourse);
      if (cSem) fd.append('semester_id', cSem);
      cImages.forEach(f => fd.append('images', f));
      await createProduct(fd);
      setShowCreate(false); resetCreateForm(); loadProducts();
    } catch (err) { alert('Ошибка: ' + (err as Error).message); }
    finally { setCreating(false); }
  };

  const resetCreateForm = () => {
    setCName(''); setCDesc(''); setCCost(''); setCPrice(''); setCStock(''); setCTag('');
    setCPriority(''); setCSellerId(''); setCUni(''); setCFac(''); setCCourse(''); setCSem('');
    setCImages([]); setCPreviews([]);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setEName(p.name); setEDesc(p.description || '');
    setECost(String(p.cost_price)); setEPrice(String(p.price));
    setEStock(String(p.stock)); setETag(p.tag || ''); setEPriority(String(p.priority));
    setEActive(p.is_active);
    setEUni(p.university_id?.toString() || '');
    setEFac(p.faculty_id?.toString() || '');
    setECourse(p.course_id?.toString() || '');
    setESem(p.semester_id?.toString() || '');
    if (p.university_id) academic.loadFaculties(p.university_id);
  };

  const handleUpdate = async () => {
    if (!editingProduct) return;
    setUpdating(true);
    try {
      const data: Record<string, unknown> = {
        name: eName, description: eDesc,
        cost_price: Number(eCost), price: Number(ePrice),
        stock: Number(eStock), tag: eTag, priority: Number(ePriority),
        is_active: eActive,
        university_id: eUni ? Number(eUni) : 0,
        faculty_id: eFac ? Number(eFac) : 0,
        course_id: eCourse ? Number(eCourse) : 0,
        semester_id: eSem ? Number(eSem) : 0,
      };
      await updateProduct(editingProduct.id, data);
      setEditingProduct(null); loadProducts();
    } catch (err) { alert('Ошибка: ' + (err as Error).message); }
    finally { setUpdating(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить продукт?')) return;
    setDeletingId(id);
    try { await deleteProduct(id); loadProducts(); }
    catch (err) { alert('Ошибка: ' + (err as Error).message); }
    finally { setDeletingId(null); }
  };

  const handleAddImages = async (productId: number) => {
    const input = document.createElement('input');
    input.type = 'file'; input.multiple = true; input.accept = 'image/*';
    input.onchange = async () => {
      const files = Array.from(input.files || []);
      if (files.length === 0) return;
      const fd = new FormData();
      files.forEach(f => fd.append('images', f));
      try { await addProductImages(productId, fd); loadProducts(); }
      catch (err) { alert('Ошибка: ' + (err as Error).message); }
    };
    input.click();
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard/market')} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3"><Package className="h-8 w-8" />{categoryName}</h1>
            <p className="text-muted-foreground">{total} продуктов{categoryId ? ` в категории #${categoryId}` : ''}</p>
          </div>
        </div>
        <Button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />Добавить продукт
        </Button>
      </div>

      {loading && <div className="text-center py-12 text-muted-foreground">Загрузка...</div>}
      {error && <div className="text-center py-12 text-destructive">{error}</div>}
      {!loading && !error && products.length === 0 && <div className="text-center py-12 text-muted-foreground"><Package className="h-12 w-12 mx-auto mb-4 opacity-50" />Продукты не найдены</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(p => (
          <Card key={p.id} className={`overflow-hidden card-hover ${!p.is_active ? 'opacity-60' : ''}`}>
            <div className="aspect-square relative bg-muted">
              {p.images && p.images.length > 0 ? (
                <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Image className="h-12 w-12 text-muted-foreground/30" /></div>
              )}
              {p.images && p.images.length > 1 && (
                <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded-full">{p.images.length} фото</span>
              )}
              {!p.is_active && (
                <span className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full flex items-center gap-1"><EyeOff className="h-3 w-3" />Скрыт</span>
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                <button onClick={() => handleAddImages(p.id)} className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-colors"><ImagePlus className="h-3.5 w-3.5" /></button>
                <button onClick={() => openEdit(p)} className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id} className="p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50">
                  {deletingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-1 truncate">{p.name}</h3>
              {p.tag && (
                <span className="inline-block mb-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{p.tag}</span>
              )}
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-lg font-bold text-primary">{p.price} сом.</span>
                <span className="text-xs text-muted-foreground line-through">{p.cost_price} сом.</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Склад: {p.stock}</span>
                <span>Приоритет: {p.priority}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>Продавец: #{p.seller_id}</span>
                {p.rating > 0 && <span>★ {p.rating.toFixed(1)}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {total > LIMIT && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline px-3 py-1 rounded disabled:opacity-50">‹</button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-outline px-3 py-1 rounded disabled:opacity-50">›</button>
        </div>
      )}

      {/* ===== CREATE MODAL ===== */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={() => { setShowCreate(false); resetCreateForm(); }}>
          <Card className="w-full max-w-xl animate-in my-8" onClick={e => e.stopPropagation()}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Новый продукт</h2>
                <button onClick={() => { setShowCreate(false); resetCreateForm(); }} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4">
                <div><label className="text-sm font-medium mb-1 block">Название *</label><Input value={cName} onChange={e => setCName(e.target.value)} placeholder="Название продукта" /></div>
                <div><label className="text-sm font-medium mb-1 block">Описание</label><textarea value={cDesc} onChange={e => setCDesc(e.target.value)} placeholder="Описание" className="w-full px-3 py-2 rounded-md border bg-transparent focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]" /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-sm font-medium mb-1 block">Себестоимость *</label><Input type="number" step="0.01" value={cCost} onChange={e => setCCost(e.target.value)} /></div>
                  <div><label className="text-sm font-medium mb-1 block">Цена *</label><Input type="number" step="0.01" value={cPrice} onChange={e => setCPrice(e.target.value)} /></div>
                  <div><label className="text-sm font-medium mb-1 block">Склад</label><Input type="number" value={cStock} onChange={e => setCStock(e.target.value)} /></div>
                </div>
                <div><label className="text-sm font-medium mb-1 block">Тег (категория для фильтра)</label><Input value={cTag} onChange={e => setCTag(e.target.value)} placeholder="например: Халаты, Шапки" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm font-medium mb-1 block">Приоритет</label><Input type="number" value={cPriority} onChange={e => setCPriority(e.target.value)} placeholder="0" /></div>
                  {role === 'admin' && (
                    <div>
                      <label className="text-sm font-medium mb-1 block">Продавец *</label>
                      <select value={cSellerId} onChange={e => setCSellerId(e.target.value)} className="w-full px-3 py-2 rounded-md border bg-transparent">
                        <option value="">Выберите</option>
                        {allSellers.map(s => <option key={s.id} value={s.id}>{s.name || s.login} (#{s.id})</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <AcademicSelectors uni={cUni} setUni={setCUni} fac={cFac} setFac={setCFac} course={cCourse} setCourse={setCCourse} sem={cSem} setSem={setCSem} universities={academic.universities} faculties={academic.faculties} courses={academic.courses} semesters={academic.semesters} onUniversityChange={academic.loadFaculties} />

                <div>
                  <label className="text-sm font-medium mb-2 block">Изображения *</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {cPreviews.map((src, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                    <label className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                      <Plus className="h-6 w-6 text-muted-foreground" />
                      <input type="file" accept="image/*" multiple onChange={handleImagesChange} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1 btn-outline" onClick={() => { setShowCreate(false); resetCreateForm(); }}>Отмена</Button>
                  <Button className="flex-1 btn-primary" onClick={handleCreate} disabled={!cName || !cPrice || !cCost || cImages.length === 0 || creating}>
                    {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Создание...</> : 'Создать'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== EDIT MODAL ===== */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={() => setEditingProduct(null)}>
          <Card className="w-full max-w-xl animate-in my-8" onClick={e => e.stopPropagation()}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Редактировать #{editingProduct.id}</h2>
                <button onClick={() => setEditingProduct(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4">
                {editingProduct.images && editingProduct.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {editingProduct.images.map((src, i) => (
                      <img key={i} src={src} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                    ))}
                  </div>
                )}
                <div><label className="text-sm font-medium mb-1 block">Название</label><Input value={eName} onChange={e => setEName(e.target.value)} /></div>
                <div><label className="text-sm font-medium mb-1 block">Описание</label><textarea value={eDesc} onChange={e => setEDesc(e.target.value)} className="w-full px-3 py-2 rounded-md border bg-transparent focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]" /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-sm font-medium mb-1 block">Себестоимость</label><Input type="number" step="0.01" value={eCost} onChange={e => setECost(e.target.value)} /></div>
                  <div><label className="text-sm font-medium mb-1 block">Цена</label><Input type="number" step="0.01" value={ePrice} onChange={e => setEPrice(e.target.value)} /></div>
                  <div><label className="text-sm font-medium mb-1 block">Склад</label><Input type="number" value={eStock} onChange={e => setEStock(e.target.value)} /></div>
                </div>
                <div><label className="text-sm font-medium mb-1 block">Тег (категория для фильтра)</label><Input value={eTag} onChange={e => setETag(e.target.value)} placeholder="например: Халаты, Шапки" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm font-medium mb-1 block">Приоритет</label><Input type="number" value={ePriority} onChange={e => setEPriority(e.target.value)} /></div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-3 cursor-pointer pb-2">
                      <input type="checkbox" checked={eActive} onChange={e => setEActive(e.target.checked)} className="w-5 h-5 rounded accent-primary" />
                      <span className="text-sm font-medium flex items-center gap-1">{eActive ? <><Eye className="h-4 w-4" />Активен</> : <><EyeOff className="h-4 w-4" />Скрыт</>}</span>
                    </label>
                  </div>
                </div>
                <AcademicSelectors uni={eUni} setUni={setEUni} fac={eFac} setFac={setEFac} course={eCourse} setCourse={setECourse} sem={eSem} setSem={setESem} universities={academic.universities} faculties={academic.faculties} courses={academic.courses} semesters={academic.semesters} onUniversityChange={academic.loadFaculties} />
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1 btn-outline" onClick={() => setEditingProduct(null)}>Отмена</Button>
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
