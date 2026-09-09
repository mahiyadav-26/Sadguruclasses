import { useState, useEffect, useMemo, useRef } from "react";
import { reportError } from "@/lib/sentry";
import { useNavigate, useSearchParams } from "react-router-dom";
import { openResource } from "@/lib/openResource";
import { supabase } from "../integrations/supabase/client";
// detectFileType / fileTypeOptions / MaterialFileType moved into LibraryManager
// where they are now the only consumers. Removed from Admin.tsx to drop dead
// imports after the library tab extraction.
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ScrollArea } from "../components/ui/scroll-area";
import { Textarea } from "../components/ui/textarea";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "../components/ui/dialog";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import {
  Upload, Users, CheckCircle, XCircle, Clock,
  Trash2, Plus, BookOpen, ExternalLink, ShieldAlert, Search,
  Download, Filter, RefreshCw, Eye, IndianRupee, Loader2, Library, Calendar,
  GraduationCap, UserCheck, UserX, Radio, ImageIcon, MessageSquare, Monitor, MonitorPlay, Smartphone, LogOut,
  FileText, Link as LinkIcon, LayoutDashboard,
} from "lucide-react";

import ContentDrillDown from "../components/admin/ContentDrillDown";
import SocialLinksManager from "../components/admin/SocialLinksManager";
import PlayerReaderControlsManager from "../components/admin/PlayerReaderControls";
import HeroBannerManager from "../components/admin/HeroBannerManager";

import LandingCoursesManager from "../components/admin/LandingCoursesManager";
import TestimonialsManager from "../components/admin/TestimonialsManager";
import SyllabusManager from "../components/admin/SyllabusManager";
import TimetableManager from "../components/admin/TimetableManager";
import EnrollmentManager from "../components/admin/EnrollmentManager";
import LibraryManager from "../components/admin/LibraryManager";

interface UserWithRole {
  id: string;
  full_name: string | null;
  email: string | null;
  mobile: string | null;
  created_at: string | null;
  role: string | null;
}

// EnrollmentManager extracted to src/components/admin/EnrollmentManager.tsx
// (memoized, lazy-mountable, easier to test).


const Admin = () => {
  const confirmAction = useConfirm();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const activeTab = searchParams.get("tab") || "overview";
  const setActiveTab = (tab: string) => setSearchParams({ tab }, { replace: true });

  // Auto-center the active tab inside the horizontally scrolling TabsList so
  // its label is never clipped at the edges.
  // PERF/UX — do NOT use `scrollIntoView` here: it scrolls every ancestor
  // scroller (including <main> and the document), which yanks the whole admin
  // page. We scroll the chip container itself instead, with a single layout
  // read inside one rAF.
  const tabsScrollerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const scroller = tabsScrollerRef.current;
      const chip = scroller?.querySelector<HTMLElement>(`[data-tab="${activeTab}"]`);
      if (!scroller || !chip) return;
      const target = chip.offsetLeft - (scroller.clientWidth - chip.offsetWidth) / 2;
      const max = scroller.scrollWidth - scroller.clientWidth;
      const left = Math.max(0, Math.min(target, max));
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      scroller.scrollTo({ left, behavior: reduce ? "auto" : "smooth" });
    });
    return () => cancelAnimationFrame(raf);
  }, [activeTab]);


  // -- DATA STATES --
  const [payments, setPayments] = useState<any[]>([]);
  const [razorpayPayments, setRazorpayPayments] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [roleChanging, setRoleChanging] = useState<Record<string, boolean>>({});
  const [statsData, setStatsData] = useState({
    totalStudents: 0,
    totalCourses: 0,
    pendingPayments: 0,
    activeEnrollments: 0,
    totalRevenue: 0,
    activeSessions: 0,
  });

  // -- SESSIONS STATE --
  const [sessionsList, setSessionsList] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [terminatingSession, setTerminatingSession] = useState<string | null>(null);

  // -- SEARCH & FILTER STATES --
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<"pending" | "approved" | "rejected" | "completed" | "refunded" | "all">("all");
  const [refundingPayment, setRefundingPayment] = useState<string | null>(null);
  const [courseSearch, setCourseSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "student" | "teacher" | "admin">("all");
  const [teacherSearch, setTeacherSearch] = useState("");

  // -- COURSE CREATION STATE --
  const [newCourse, setNewCourse] = useState({ title: "", description: "", price: "", grade: "", startDate: "", endDate: "" });
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [courseThumbnailUrl, setCourseThumbnailUrl] = useState("");
  const [courseThumbnailMode, setCourseThumbnailMode] = useState<"file" | "url">("file");

  // -- INLINE EDIT: Course --
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [editCourseData, setEditCourseData] =  useState({ title: "", description: "", price: "", grade: "", startDate: "", endDate: "" });
  const [editThumbnailFile, setEditThumbnailFile] = useState<File | null>(null);
  const [editThumbnailUrl, setEditThumbnailUrl] = useState("");
  const [editThumbnailMode, setEditThumbnailMode] = useState<"file" | "url">("file");

  // -- LIBRARY STATE moved into <LibraryManager /> (src/components/admin/LibraryManager.tsx).
  // It owns its 13 local state slices + 7 handlers + fetchLibraryData side-effect.
  // Admin only passes coursesList so the memoized child won't re-render on tab switches.

  // Admin access protection
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please login to access admin panel");
      navigate("/admin/login");
    } else if (!authLoading && user && !isAdmin) {
      toast.error("Access denied. Admin privileges required.");
      navigate("/dashboard");
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) fetchDashboardData();
  }, [user, isAdmin]);

  // --- FETCH DATA ---
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Supabase status values can be capitalised (e.g. 'Approved', 'Completed')
      // depending on how the row was inserted, so match case-insensitively.
      const { data: approvedPayments } = await supabase.from('payment_requests').select('amount').ilike('status', 'approved');
      const { data: completedRzp } = await supabase.from('razorpay_payments').select('amount').ilike('status', 'completed');
      const manualRevenue = approvedPayments?.reduce((sum, p) => sum + (x.amount || 0), 0) || 0;
      const rz`Revenue = completedRzp?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;