'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ShoppingBag, Plus, Trash2, Image, X, Users, Loader2,
  LayoutGrid, Pencil, Tag, ClipboardList
} from 'lucide-react';
import { getBanners, createBanner, updateBanner, deleteBanner } from '@/lib/banner';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/category';
import { getSellers } from '@/lib/seller';
import { getRoleFromToken, getCanCreateBanner } from '@/lib/auth-utils';
import { useAcademicData, AcademicSelectors, AcademicTags } from '@/components/AcademicSelectors';
import type { Banner } from '../../../../types/banner';
import type { Category } from '../../../../types/category';
import type { Seller } from '../../../../types/seller';

type ActiveTab = 'banners' | 'categories';

export default function MarketPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [canCreate, setCanCreate] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('banners');
  const academic = useAcademicData();

  // ===== BANNERS =====
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerTotal, setBannerTotal] = useState(0);
  const [bannerPage, setBannerPage] = useState(1);
  const [bannerLoading, setBannerLoading] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [bannerCreating, setBannerCreating] = useState(false);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerDesc, setBannerDesc] = useState('');
  const [bannerUni, setBannerUni] = useState('');
  const [bannerFac, setBannerFac] = useState('');
  const [bannerCourse, setBannerCourse] = useState('');
  const [bannerSem, setBannerSem] = useState('');
  const [deletingBannerId, setDeletingBannerId] = useState<number | null>(null);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [ebDesc, setEbDesc] = useState('');
  const [ebUni, setEbUni] = useState('');
  const [ebFac, setEbFac] = useState('');
  const [ebCourse, setEbCourse] = useState('');
  const [ebSem, setEbSem] = useState('');
  const [bannerUpdating, setBannerUpdating] = useState(false);

  // ===== CATEGORIES =====
  const [categories, setCategories] = useState<Category[]>([]);
  const [catTotal, setCatTotal] = useState(0);
  const [catPage, setCatPage] = useState(1);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);
  const [showCatModal, setShowCatModal] = useState(false);
  const [catCreating, setCatCreating] = useState(false);
  const [catImage, setCatImage] = useState<File | null>(null);
  const [catPreview, setCatPreview] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catUni, setCatUni] = useState('');
  const [catFac, setCatFac] = useState('');
  const [catCourse, setCatCourse] = useState('');
  const [catSem, setCatSem] = useState('');
  const [catSellerIds, setCatSellerIds] = useState<number[]>([]);
  const [deletingCatId, setDeletingCatId] = useState<number | null>(null);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [ecName, setEcName] = useState('');
  const [ecDesc, setEcDesc] = useState('');
  const [ecUni, setEcUni] = useState('');
  const [ecFac, setEcFac] = useState('');
  const [ecCourse, setEcCourse] = useState('');
  const [ecSem, setEcSem] = useState('');
  const [ecSellerIds, setEcSellerIds] = useState<number[]>([]);
  const [catUpdating, setCatUpdating] = useState(false);

  const [allSellers, setAllSellers] = useState<Seller[]>([]);
  const LIMIT = 12;

  useEffect(() => {
    const r = getRoleFromToken();
    setRole(r);
    setCanCreate(r === 'admin' || getCanCreateBanner());
  }, []);

  useEffect(() => {
    if (role === 'admin') getSellers(1, 100).then(res => setAllSellers(res.data || [])).catch(() => {});
  }, [role]);

  // ===== BANNER LOGIC =====
  const loadBanners = useCallback(async () => {
    setBannerLoading(true); setBannerError(null);
    try { const res = await getBanners(bannerPage, LIMIT); setBanners(res.data || []); setBannerTotal(res.total_count); }
    catch (err) { setBannerError((err as Error).message); }
    finally { setBannerLoading(false); }
  }, [bannerPage]);

  useEffect(() => { if (activeTab === 'banners') loadBanners(); }, [activeTab, loadBanners]);

  const handleBannerCreate = async () => {
    if (!bannerImage) return;
    setBannerCreating(true);
    try {
      const fd = new FormData();
      fd.append('image', bannerImage);
      if (bannerDesc) fd.append('description', bannerDesc);
      if (bannerUni) fd.append('university_id', bannerUni);
      if (bannerFac) fd.append('faculty_id', bannerFac);
      if (bannerCourse) fd.append('course_id', bannerCourse);
      if (bannerSem) fd.append('semester_id', bannerSem);
      await createBanner(fd);
      setShowBannerModal(false); resetBannerForm(); loadBanners();
    } catch (err) { alert('Ошибка: ' + (err as Error).message); }
    finally { setBannerCreating(false); }
  };

  const openBannerEdit = (b: Banner) => {
    setEditingBanner(b);
    setEbDesc(b.description || '');
    setEbUni(b.university_id?.toString() || '');
    setEbFac(b.faculty_id?.toString() || '');
    setEbCourse(b.course_id?.toString() || '');
    setEbSem(b.semester_id?.toString() || '');
    if (b.university_id) academic.loadFaculties(b.university_id);
  };

  const handleBannerUpdate = async () => {
    if (!editingBanner) return;
    setBannerUpdating(true);
    try {
      const data: Record<string, unknown> = {
        description: ebDesc,
        university_id: ebUni ? Number(ebUni) : 0,
        faculty_id: ebFac ? Number(ebFac) : 0,
        course_id: ebCourse ? Number(ebCourse) : 0,
        semester_id: ebSem ? Number(ebSem) : 0,
      };
      await updateBanner(editingBanner.id, data);
      setEditingBanner(null); loadBanners();
    } catch (err) { alert('Ошибка: ' + (err as Error).message); }
    finally { setBannerUpdating(false); }
  };

  const handleBannerDelete = async (id: number) => {
    if (!confirm('Удалить баннер?')) return;
    setDeletingBannerId(id);
    try { await deleteBanner(id); loadBanners(); } catch (err) { alert('Ошибка: ' + (err as Error).message); }
    finally { setDeletingBannerId(null); }
  };

  const resetBannerForm = () => { setBannerImage(null); setBannerPreview(null); setBannerDesc(''); setBannerUni(''); setBannerFac(''); setBannerCourse(''); setBannerSem(''); };

  // ===== CATEGORY LOGIC =====
  const loadCategories = useCallback(async () => {
    setCatLoading(true); setCatError(null);
    try { const res = await getCategories(catPage, LIMIT); setCategories(res.data || []); setCatTotal(res.total_count); }
    catch (err) { setCatError((err as Error).message); }
    finally { setCatLoading(false); }
  }, [catPage]);

  useEffect(() => { if (activeTab === 'categories') loadCategories(); }, [activeTab, loadCategories]);

  const handleCatCreate = async () => {
    if (!catImage || !catName) return;
    setCatCreating(true);
    try {
      const fd = new FormData();
      fd.append('image', catImage); fd.append('name', catName);
      if (catDesc) fd.append('description', catDesc);
      if (catUni) fd.append('university_id', catUni);
      if (catFac) fd.append('faculty_id', catFac);
      if (catCourse) fd.append('course_id', catCourse);
      if (catSem) fd.append('semester_id', catSem);
      if (catSellerIds.length > 0) fd.append('seller_ids', catSellerIds.join(','));
      await createCategory(fd);
      setShowCatModal(false); resetCatForm(); loadCategories();
    } catch (err) { alert('Ошибка: ' + (err as Error).message); }
    finally { setCatCreating(false); }
  };

  const openCatEdit = (cat: Category) => {
    setEditingCat(cat);
    setEcName(cat.name); setEcDesc(cat.description || '');
    setEcUni(cat.university_id?.toString() || '');
    setEcFac(cat.faculty_id?.toString() || '');
    setEcCourse(cat.course_id?.toString() || '');
    setEcSem(cat.semester_id?.toString() || '');
    setEcSellerIds(cat.sellers?.map(s => s.id) || []);
    if (cat.university_id) academic.loadFaculties(cat.university_id);
  };

  const handleCatUpdate = async () => {
    if (!editingCat) return;
    setCatUpdating(true);
    try {
      const data: Record<string, unknown> = {
        name: ecName, description: ecDesc, seller_ids: ecSellerIds,
        university_id: ecUni ? Number(ecUni) : 0,
        faculty_id: ecFac ? Number(ecFac) : 0,
        course_id: ecCourse ? Number(ecCourse) : 0,
        semester_id: ecSem ? Number(ecSem) : 0,
      };
      await updateCategory(editingCat.id, data);
      setEditingCat(null); loadCategories();
    } catch (err) { alert('Ошибка: ' + (err as Error).message); }
    finally { setCatUpdating(false); }
  };

  const handleCatDelete = async (id: number) => {
    if (!confirm('Удалить категорию?')) return;
    setDeletingCatId(id);
    try { await deleteCategory(id); loadCategories(); } catch (err) { alert('Ошибка: ' + (err as Error).message); }
    finally { setDeletingCatId(null); }
  };

  const resetCatForm = () => { setCatImage(null); setCatPreview(null); setCatName(''); setCatDesc(''); setCatUni(''); setCatFac(''); setCatCourse(''); setCatSem(''); setCatSellerIds([]); };

  const toggleSeller = (ids: number[], setIds: (v: number[]) => void, id: number) => {
    setIds(ids.includes(id) ? ids.filter(s => s !== id) : [...ids, id]);
  };

  const renderSellerPicker = (ids: number[], setIds: (v: number[]) => void) => (
    allSellers.length > 0 ? (
      <div>
        <label className="text-sm font-medium mb-2 block">Продавцы</label>
        <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
          {allSellers.map(s => (
            <label key={s.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer transition-colors">
              <input type="checkbox" checked={ids.includes(s.id)} onChange={() => toggleSeller(ids, setIds, s.id)} className="w-4 h-4 rounded border-2 accent-primary" />
              <span className="text-sm">{s.name || s.login}</span>
              <span className="text-xs text-muted-foreground ml-auto">#{s.id}</span>
            </label>
          ))}
        </div>
        {ids.length > 0 && <p className="text-xs text-muted-foreground mt-1">Выбрано: {ids.length}</p>}
      </div>
    ) : null
  );

  const bannerPages = Math.max(1, Math.ceil(bannerTotal / LIMIT));
  const catPages = Math.max(1, Math.ceil(catTotal / LIMIT));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><ShoppingBag className="h-8 w-8" />Магазин</h1>
          <p className="text-muted-foreground">Управление баннерами, категориями и продавцами</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="btn-outline" variant="outline" onClick={() => router.push('/dashboard/market/orders')}><ClipboardList className="mr-2 h-4 w-4" />Заказы</Button>
          {role === 'admin' && <Button className="btn-outline" variant="outline" onClick={() => router.push('/dashboard/market/sellers')}><Users className="mr-2 h-4 w-4" />Продавцы</Button>}
          {activeTab === 'banners' && canCreate && <Button className="btn-primary" onClick={() => setShowBannerModal(true)}><Plus className="mr-2 h-4 w-4" />Добавить баннер</Button>}
          {activeTab === 'categories' && role === 'admin' && <Button className="btn-primary" onClick={() => setShowCatModal(true)}><Plus className="mr-2 h-4 w-4" />Добавить категорию</Button>}
        </div>
      </div>

      <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg w-fit">
        <button onClick={() => setActiveTab('banners')} className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'banners' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><Image className="h-4 w-4" />Баннеры</button>
        <button onClick={() => setActiveTab('categories')} className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'categories' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><LayoutGrid className="h-4 w-4" />Категории</button>
      </div>

      {/* BANNERS TAB */}
      {activeTab === 'banners' && (
        <>
          {bannerLoading && <div className="text-center py-12 text-muted-foreground">Загрузка...</div>}
          {bannerError && <div className="text-center py-12 text-destructive">{bannerError}</div>}
          {!bannerLoading && !bannerError && banners.length === 0 && <div className="text-center py-12 text-muted-foreground"><Image className="h-12 w-12 mx-auto mb-4 opacity-50" />Баннеры не найдены</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((b) => (
              <Card key={b.id} className="overflow-hidden card-hover">
                <div className="aspect-video relative bg-muted">
                  <img src={b.image_path} alt={b.description || 'Баннер'} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button onClick={() => openBannerEdit(b)} className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-colors"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleBannerDelete(b.id)} disabled={deletingBannerId === b.id} className="p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50">
                      {deletingBannerId === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <CardContent className="p-4">
                  {b.description && <p className="text-sm mb-3">{b.description}</p>}
                  <AcademicTags item={b} />
                </CardContent>
              </Card>
            ))}
          </div>
          {bannerTotal > LIMIT && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setBannerPage(p => Math.max(1, p - 1))} disabled={bannerPage === 1} className="btn-outline px-3 py-1 rounded disabled:opacity-50">‹</button>
              <span className="text-sm text-muted-foreground">{bannerPage} / {bannerPages}</span>
              <button onClick={() => setBannerPage(p => Math.min(bannerPages, p + 1))} disabled={bannerPage === bannerPages} className="btn-outline px-3 py-1 rounded disabled:opacity-50">›</button>
            </div>
          )}
        </>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <>
          {catLoading && <div className="text-center py-12 text-muted-foreground">Загрузка...</div>}
          {catError && <div className="text-center py-12 text-destructive">{catError}</div>}
          {!catLoading && !catError && categories.length === 0 && <div className="text-center py-12 text-muted-foreground"><LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-50" />Категории не найдены</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Card key={cat.id} className="overflow-hidden card-hover cursor-pointer" onClick={() => router.push(`/dashboard/market/products?category_id=${cat.id}&name=${encodeURIComponent(cat.name)}`)}>
                <div className="aspect-video relative bg-muted">
                  <img src={cat.image_path} alt={cat.name} className="w-full h-full object-cover" />
                  {role === 'admin' && (
                    <div className="absolute top-2 right-2 flex gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openCatEdit(cat)} className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleCatDelete(cat.id)} disabled={deletingCatId === cat.id} className="p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50">
                        {deletingCatId === cat.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{cat.name}</h3>
                  {cat.description && <p className="text-sm text-muted-foreground mb-3">{cat.description}</p>}
                  <div className="mb-3"><AcademicTags item={cat} /></div>
                  {cat.sellers && cat.sellers.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Tag className="h-3 w-3" />Продавцы:</p>
                      <div className="flex flex-wrap gap-1">{cat.sellers.map(s => <span key={s.id} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">{s.name || s.login}</span>)}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {catTotal > LIMIT && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setCatPage(p => Math.max(1, p - 1))} disabled={catPage === 1} className="btn-outline px-3 py-1 rounded disabled:opacity-50">‹</button>
              <span className="text-sm text-muted-foreground">{catPage} / {catPages}</span>
              <button onClick={() => setCatPage(p => Math.min(catPages, p + 1))} disabled={catPage === catPages} className="btn-outline px-3 py-1 rounded disabled:opacity-50">›</button>
            </div>
          )}
        </>
      )}

      {/* BANNER CREATE MODAL */}
      {showBannerModal && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={() => { setShowBannerModal(false); resetBannerForm(); }}>
          <Card className="w-full max-w-lg animate-in my-8" onClick={e => e.stopPropagation()}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-semibold">Новый баннер</h2><button onClick={() => { setShowBannerModal(false); resetBannerForm(); }} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button></div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Изображение *</label>
                  {bannerPreview ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-2"><img src={bannerPreview} alt="Превью" className="w-full h-full object-cover" /><button onClick={() => { setBannerImage(null); setBannerPreview(null); }} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"><X className="h-4 w-4" /></button></div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors"><Image className="h-10 w-10 text-muted-foreground mb-2" /><span className="text-sm text-muted-foreground">Нажмите для загрузки</span><input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { setBannerImage(f); setBannerPreview(URL.createObjectURL(f)); } }} className="hidden" /></label>
                  )}
                </div>
                <div><label className="text-sm font-medium mb-1 block">Описание</label><Input value={bannerDesc} onChange={e => setBannerDesc(e.target.value)} placeholder="Описание баннера" /></div>
                <AcademicSelectors uni={bannerUni} setUni={setBannerUni} fac={bannerFac} setFac={setBannerFac} course={bannerCourse} setCourse={setBannerCourse} sem={bannerSem} setSem={setBannerSem} universities={academic.universities} faculties={academic.faculties} courses={academic.courses} semesters={academic.semesters} onUniversityChange={academic.loadFaculties} />
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1 btn-outline" onClick={() => { setShowBannerModal(false); resetBannerForm(); }}>Отмена</Button>
                  <Button className="flex-1 btn-primary" onClick={handleBannerCreate} disabled={!bannerImage || bannerCreating}>{bannerCreating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Создание...</> : 'Создать'}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* BANNER EDIT MODAL */}
      {editingBanner && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={() => setEditingBanner(null)}>
          <Card className="w-full max-w-lg animate-in my-8" onClick={e => e.stopPropagation()}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-semibold">Редактировать баннер #{editingBanner.id}</h2><button onClick={() => setEditingBanner(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button></div>
              <div className="space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden bg-muted"><img src={editingBanner.image_path} alt="Баннер" className="w-full h-full object-cover" /></div>
                <div><label className="text-sm font-medium mb-1 block">Описание</label><Input value={ebDesc} onChange={e => setEbDesc(e.target.value)} placeholder="Описание" /></div>
                <AcademicSelectors uni={ebUni} setUni={setEbUni} fac={ebFac} setFac={setEbFac} course={ebCourse} setCourse={setEbCourse} sem={ebSem} setSem={setEbSem} universities={academic.universities} faculties={academic.faculties} courses={academic.courses} semesters={academic.semesters} onUniversityChange={academic.loadFaculties} />
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1 btn-outline" onClick={() => setEditingBanner(null)}>Отмена</Button>
                  <Button className="flex-1 btn-primary" onClick={handleBannerUpdate} disabled={bannerUpdating}>{bannerUpdating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Сохранение...</> : 'Сохранить'}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CATEGORY CREATE MODAL */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={() => { setShowCatModal(false); resetCatForm(); }}>
          <Card className="w-full max-w-lg animate-in my-8" onClick={e => e.stopPropagation()}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-semibold">Новая категория</h2><button onClick={() => { setShowCatModal(false); resetCatForm(); }} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button></div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Изображение *</label>
                  {catPreview ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-2"><img src={catPreview} alt="Превью" className="w-full h-full object-cover" /><button onClick={() => { setCatImage(null); setCatPreview(null); }} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"><X className="h-4 w-4" /></button></div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors"><Image className="h-10 w-10 text-muted-foreground mb-2" /><span className="text-sm text-muted-foreground">Нажмите для загрузки</span><input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { setCatImage(f); setCatPreview(URL.createObjectURL(f)); } }} className="hidden" /></label>
                  )}
                </div>
                <div><label className="text-sm font-medium mb-1 block">Название *</label><Input value={catName} onChange={e => setCatName(e.target.value)} placeholder="Название категории" /></div>
                <div><label className="text-sm font-medium mb-1 block">Описание</label><Input value={catDesc} onChange={e => setCatDesc(e.target.value)} placeholder="Описание" /></div>
                <AcademicSelectors uni={catUni} setUni={setCatUni} fac={catFac} setFac={setCatFac} course={catCourse} setCourse={setCatCourse} sem={catSem} setSem={setCatSem} universities={academic.universities} faculties={academic.faculties} courses={academic.courses} semesters={academic.semesters} onUniversityChange={academic.loadFaculties} />
                {renderSellerPicker(catSellerIds, setCatSellerIds)}
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1 btn-outline" onClick={() => { setShowCatModal(false); resetCatForm(); }}>Отмена</Button>
                  <Button className="flex-1 btn-primary" onClick={handleCatCreate} disabled={!catImage || !catName || catCreating}>{catCreating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Создание...</> : 'Создать'}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CATEGORY EDIT MODAL */}
      {editingCat && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={() => setEditingCat(null)}>
          <Card className="w-full max-w-lg animate-in my-8" onClick={e => e.stopPropagation()}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-semibold">Редактировать категорию #{editingCat.id}</h2><button onClick={() => setEditingCat(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button></div>
              <div className="space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden bg-muted"><img src={editingCat.image_path} alt={editingCat.name} className="w-full h-full object-cover" /></div>
                <div><label className="text-sm font-medium mb-1 block">Название</label><Input value={ecName} onChange={e => setEcName(e.target.value)} /></div>
                <div><label className="text-sm font-medium mb-1 block">Описание</label><Input value={ecDesc} onChange={e => setEcDesc(e.target.value)} /></div>
                <AcademicSelectors uni={ecUni} setUni={setEcUni} fac={ecFac} setFac={setEcFac} course={ecCourse} setCourse={setEcCourse} sem={ecSem} setSem={setEcSem} universities={academic.universities} faculties={academic.faculties} courses={academic.courses} semesters={academic.semesters} onUniversityChange={academic.loadFaculties} />
                {renderSellerPicker(ecSellerIds, setEcSellerIds)}
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1 btn-outline" onClick={() => setEditingCat(null)}>Отмена</Button>
                  <Button className="flex-1 btn-primary" onClick={handleCatUpdate} disabled={catUpdating}>{catUpdating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Сохранение...</> : 'Сохранить'}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
