import { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Users,
  Calendar,
  Pencil,
  Trash2,
  GraduationCap,
  TrendingUp,
  Tag,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import type { Kategorien, Kurse } from '@/types/app';

// Local types for UI
type CourseStatus = 'active' | 'upcoming' | 'completed';

interface LocalCourse {
  record_id: string;
  title: string;
  description: string;
  category_id: string;
  instructor: string;
  max_participants: number;
  current_participants: number;
  start_date: string;
  end_date: string;
  status: CourseStatus;
}

interface LocalCategory {
  record_id: string;
  name: string;
}

// Transform API data to local format
const transformCourse = (kurse: Kurse): LocalCourse => ({
  record_id: kurse.record_id,
  title: kurse.fields.title || '',
  description: kurse.fields.description || '',
  category_id: extractRecordId(kurse.fields.category) || '',
  instructor: kurse.fields.instructor || '',
  max_participants: kurse.fields.max_participants || 20,
  current_participants: kurse.fields.current_participants || 0,
  start_date: kurse.fields.start_date || '',
  end_date: kurse.fields.end_date || '',
  status: (kurse.fields.status || 'upcoming') as CourseStatus,
});

const transformCategory = (kat: Kategorien): LocalCategory => ({
  record_id: kat.record_id,
  name: kat.fields.name || '',
});

export default function Dashboard() {
  // State
  const [courses, setCourses] = useState<LocalCourse[]>([]);
  const [categories, setCategories] = useState<LocalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Course Dialog State
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<LocalCourse | null>(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category_id: '',
    instructor: '',
    max_participants: 20,
    start_date: '',
    end_date: '',
    status: 'upcoming' as CourseStatus,
  });

  // Category Dialog State
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<LocalCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '' });

  // Delete Dialog State
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'course' | 'category';
    id: string;
    name: string;
  }>({ open: false, type: 'course', id: '', name: '' });

  // Filter State
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [kategorienData, kurseData] = await Promise.all([
        LivingAppsService.getKategorien(),
        LivingAppsService.getKurse()
      ]);
      setCategories(kategorienData.map(transformCategory));
      setCourses(kurseData.map(transformCourse));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Computed values
  const filteredCourses = courses.filter(course => {
    if (filterCategory !== 'all' && course.category_id !== filterCategory) return false;
    if (filterStatus !== 'all' && course.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    totalCourses: courses.length,
    activeCourses: courses.filter(c => c.status === 'active').length,
    totalParticipants: courses.reduce((sum, c) => sum + c.current_participants, 0),
    categories: categories.length,
  };

  // Course CRUD
  const openCourseDialog = (course?: LocalCourse) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm({
        title: course.title,
        description: course.description,
        category_id: course.category_id,
        instructor: course.instructor,
        max_participants: course.max_participants,
        start_date: course.start_date,
        end_date: course.end_date,
        status: course.status,
      });
    } else {
      setEditingCourse(null);
      setCourseForm({
        title: '',
        description: '',
        category_id: categories[0]?.record_id || '',
        instructor: '',
        max_participants: 20,
        start_date: '',
        end_date: '',
        status: 'upcoming',
      });
    }
    setCourseDialogOpen(true);
  };

  const saveCourse = async () => {
    if (!courseForm.title || !courseForm.instructor || !courseForm.category_id) return;

    setSaving(true);
    try {
      const fields = {
        title: courseForm.title,
        description: courseForm.description || undefined,
        category: createRecordUrl(APP_IDS.KATEGORIEN, courseForm.category_id),
        instructor: courseForm.instructor,
        max_participants: courseForm.max_participants || undefined,
        current_participants: editingCourse?.current_participants || 0,
        start_date: courseForm.start_date || undefined,
        end_date: courseForm.end_date || undefined,
        status: courseForm.status,
      };

      if (editingCourse) {
        await LivingAppsService.updateKurseEntry(editingCourse.record_id, fields);
      } else {
        await LivingAppsService.createKurseEntry(fields);
      }

      await loadData();
      setCourseDialogOpen(false);
    } catch (error) {
      console.error('Error saving course:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteCourse = async (id: string) => {
    setSaving(true);
    try {
      await LivingAppsService.deleteKurseEntry(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting course:', error);
    } finally {
      setSaving(false);
      setDeleteDialog({ open: false, type: 'course', id: '', name: '' });
    }
  };

  // Category CRUD
  const openCategoryDialog = (category?: LocalCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({ name: category.name });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '' });
    }
    setCategoryDialogOpen(true);
  };

  const saveCategory = async () => {
    if (!categoryForm.name) return;

    setSaving(true);
    try {
      if (editingCategory) {
        await LivingAppsService.updateKategorienEntry(editingCategory.record_id, {
          name: categoryForm.name
        });
      } else {
        await LivingAppsService.createKategorienEntry({
          name: categoryForm.name
        });
      }

      await loadData();
      setCategoryDialogOpen(false);
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id: string) => {
    setSaving(true);
    try {
      await LivingAppsService.deleteKategorienEntry(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting category:', error);
    } finally {
      setSaving(false);
      setDeleteDialog({ open: false, type: 'category', id: '', name: '' });
    }
  };

  // Helper functions
  const getCategoryName = (id: string) => {
    return categories.find(c => c.record_id === id)?.name || 'Unbekannt';
  };

  const getStatusColor = (status: CourseStatus) => {
    switch (status) {
      case 'active': return 'bg-status-active';
      case 'upcoming': return 'bg-status-upcoming';
      case 'completed': return 'bg-status-completed';
    }
  };

  const getStatusLabel = (status: CourseStatus) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'upcoming': return 'Geplant';
      case 'completed': return 'Abgeschlossen';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="size-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Daten werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="hero-gradient text-hero px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Kursverwaltung
              </h1>
              <p className="mt-2 text-hero-muted">
                Verwalten Sie Ihre Kurse und Kategorien
              </p>
            </div>
            <Button
              onClick={() => openCourseDialog()}
              className="hero-shadow bg-card text-foreground hover:bg-card/90 transition-smooth self-start sm:self-center"
              size="lg"
            >
              <Plus className="mr-2 size-5" />
              Neuer Kurs
            </Button>
          </div>

          {/* Hero Stats */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl bg-card/10 backdrop-blur-sm p-4 transition-smooth hover:bg-card/20">
              <div className="flex items-center gap-3">
                <BookOpen className="size-8 text-hero-muted" />
                <div>
                  <p className="text-3xl font-bold">{stats.totalCourses}</p>
                  <p className="text-sm text-hero-muted">Kurse gesamt</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-card/10 backdrop-blur-sm p-4 transition-smooth hover:bg-card/20">
              <div className="flex items-center gap-3">
                <TrendingUp className="size-8 text-hero-muted" />
                <div>
                  <p className="text-3xl font-bold">{stats.activeCourses}</p>
                  <p className="text-sm text-hero-muted">Aktive Kurse</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-card/10 backdrop-blur-sm p-4 transition-smooth hover:bg-card/20">
              <div className="flex items-center gap-3">
                <Users className="size-8 text-hero-muted" />
                <div>
                  <p className="text-3xl font-bold">{stats.totalParticipants}</p>
                  <p className="text-sm text-hero-muted">Teilnehmer</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-card/10 backdrop-blur-sm p-4 transition-smooth hover:bg-card/20">
              <div className="flex items-center gap-3">
                <Tag className="size-8 text-hero-muted" />
                <div>
                  <p className="text-3xl font-bold">{stats.categories}</p>
                  <p className="text-sm text-hero-muted">Kategorien</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Categories Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Tag className="size-5 text-primary" />
              Kategorien
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openCategoryDialog()}
            >
              <Plus className="mr-1 size-4" />
              Kategorie
            </Button>
          </div>
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-sm">Noch keine Kategorien vorhanden.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Badge
                  key={category.record_id}
                  variant="secondary"
                  className="px-3 py-1.5 text-sm cursor-pointer group transition-smooth hover:bg-secondary/80"
                >
                  {category.name}
                  <span className="ml-2 opacity-0 group-hover:opacity-100 transition-smooth inline-flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); openCategoryDialog(category); }}
                      className="hover:text-primary"
                    >
                      <Pencil className="size-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteDialog({ open: true, type: 'category', id: category.record_id, name: category.name });
                      }}
                      className="hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </span>
                </Badge>
              ))}
            </div>
          )}
        </section>

        {/* Filters */}
        <section className="mb-6 flex flex-wrap gap-4">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Kategorie filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.record_id} value={cat.record_id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="active">Aktiv</SelectItem>
              <SelectItem value="upcoming">Geplant</SelectItem>
              <SelectItem value="completed">Abgeschlossen</SelectItem>
            </SelectContent>
          </Select>
        </section>

        {/* Courses Grid */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <GraduationCap className="size-5 text-primary" />
            Kurse ({filteredCourses.length})
          </h2>

          {filteredCourses.length === 0 ? (
            <Card className="card-shadow">
              <CardContent className="py-12 text-center">
                <BookOpen className="mx-auto size-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Keine Kurse gefunden</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => openCourseDialog()}
                >
                  <Plus className="mr-2 size-4" />
                  Ersten Kurs erstellen
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map(course => (
                <Card
                  key={course.record_id}
                  className="card-shadow transition-smooth hover:shadow-lg group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Badge
                        className={`${getStatusColor(course.status)} text-card border-0`}
                      >
                        {getStatusLabel(course.status)}
                      </Badge>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-smooth">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openCourseDialog(course)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteDialog({
                            open: true,
                            type: 'course',
                            id: course.record_id,
                            name: course.title
                          })}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="mt-2 text-lg leading-tight">
                      {course.title}
                    </CardTitle>
                    {course.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {course.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {getCategoryName(course.category_id)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="size-4 text-muted-foreground" />
                      <span>
                        {course.current_participants} / {course.max_participants} Teilnehmer
                      </span>
                      {course.current_participants >= course.max_participants && (
                        <Badge variant="destructive" className="text-xs">Voll</Badge>
                      )}
                    </div>
                    {(course.start_date || course.end_date) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="size-4" />
                        <span>
                          {formatDate(course.start_date)} - {formatDate(course.end_date)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <GraduationCap className="size-4" />
                      <span>{course.instructor}</span>
                    </div>

                    {/* Participant Progress */}
                    <div className="pt-2">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{
                            width: `${Math.min((course.current_participants / course.max_participants) * 100, 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Course Dialog */}
      <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? 'Kurs bearbeiten' : 'Neuer Kurs'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Titel *</label>
              <Input
                value={courseForm.title}
                onChange={e => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Kurstitel eingeben"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Beschreibung</label>
              <Input
                value={courseForm.description}
                onChange={e => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Kurze Beschreibung"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Kategorie *</label>
                <Select
                  value={courseForm.category_id}
                  onValueChange={value => setCourseForm(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.record_id} value={cat.record_id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={courseForm.status}
                  onValueChange={value => setCourseForm(prev => ({
                    ...prev,
                    status: value as CourseStatus
                  }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Geplant</SelectItem>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="completed">Abgeschlossen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kursleiter *</label>
              <Input
                value={courseForm.instructor}
                onChange={e => setCourseForm(prev => ({ ...prev, instructor: e.target.value }))}
                placeholder="Name des Kursleiters"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max. Teilnehmer</label>
              <Input
                type="number"
                value={courseForm.max_participants}
                onChange={e => setCourseForm(prev => ({
                  ...prev,
                  max_participants: parseInt(e.target.value) || 0
                }))}
                min={1}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Startdatum</label>
                <Input
                  type="date"
                  value={courseForm.start_date}
                  onChange={e => setCourseForm(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Enddatum</label>
                <Input
                  type="date"
                  value={courseForm.end_date}
                  onChange={e => setCourseForm(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={saveCourse} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editingCourse ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={categoryForm.name}
                onChange={e => setCategoryForm({ name: e.target.value })}
                placeholder="Kategoriename eingeben"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={saveCategory} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editingCategory ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteDialog.type === 'course' ? 'Kurs löschen?' : 'Kategorie löschen?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie "{deleteDialog.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDialog.type === 'course') {
                  deleteCourse(deleteDialog.id);
                } else {
                  deleteCategory(deleteDialog.id);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
