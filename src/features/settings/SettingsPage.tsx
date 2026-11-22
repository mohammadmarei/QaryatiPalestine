import { useState, type ReactNode } from "react";
import {
  Bell,
  Database,
  Languages,
  MonitorCog,
  RotateCcw,
  Save,
  UserCog,
} from "lucide-react";
import type { Lang } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Field, Select, Switch } from "@/components/forms/Fields";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/hooks/useI18n";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/utils/cn";
import { sleep } from "@/utils/misc";
import { storage } from "@/utils/storage";
import {
  applyMotionPreference,
  defaultSettings,
  SETTINGS_KEY,
  type Settings,
} from "./settingsStore";

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="card grid gap-6 p-6 sm:p-8 lg:grid-cols-[16rem_1fr]">
      <div>
        <span className="flex size-10 items-center justify-center rounded-xl bg-olive-50 text-olive">
          {icon}
        </span>
        <h2 className="mt-3 text-base font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const { reloadData } = useData();
  const toast = useToast();
  const [saved, setSaved] = useState<Settings>(() => ({
    ...defaultSettings,
    ...storage.getJSON<Partial<Settings>>(SETTINGS_KEY, {}),
    language: lang,
  }));
  const [draft, setDraft] = useState<Settings>(saved);
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);

  // Keep the language field in sync if it is switched from the header.
  const [lastLang, setLastLang] = useState(lang);
  if (lang !== lastLang) {
    setLastLang(lang);
    setSaved((s) => ({ ...s, language: lang }));
    setDraft((d) => ({ ...d, language: lang }));
  }

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));
  const setNotif = (k: keyof Settings["notifications"], v: boolean) =>
    setDraft((d) => ({ ...d, notifications: { ...d.notifications, [k]: v } }));

  const save = async () => {
    setSaving(true);
    await sleep(600);
    storage.setJSON(SETTINGS_KEY, draft);
    applyMotionPreference(draft.reduceMotion);
    if (draft.language !== lang) setLang(draft.language);
    setSaved(draft);
    setSaving(false);
    toast.success(
      t("Settings saved", "تم حفظ الإعدادات"),
      t(
        "Preferences are stored in this browser.",
        "تُحفظ التفضيلات في هذا المتصفح.",
      ),
    );
  };

  const langOption = (value: Lang, label: string, sample: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={draft.language === value}
      onClick={() => set("language", value)}
      className={cn(
        "flex flex-1 items-center justify-between rounded-2xl border-2 p-4 text-start transition",
        draft.language === value
          ? "border-forest bg-olive-50"
          : "border-stone-line bg-white hover:border-olive-200",
      )}
    >
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span
          className={cn(
            "block text-xs text-muted",
            value === "ar" && "font-arabic",
          )}
        >
          {sample}
        </span>
      </span>
      <span
        className={cn(
          "size-4 rounded-full border-2",
          draft.language === value
            ? "border-forest bg-forest ring-2 ring-white ring-inset"
            : "border-stone-line",
        )}
      />
    </button>
  );

  return (
    <div className="pb-24">
      <PageHeader
        title={t("Settings", "الإعدادات")}
        description={t(
          "Personal preferences for this workspace. Everything here is saved locally.",
          "تفضيلاتك الشخصية لمساحة العمل. يُحفظ كل شيء هنا محليًا.",
        )}
      />

      <div className="space-y-6">
        <Section
          icon={<Languages className="size-5" />}
          title={t("Language", "اللغة")}
          description={t(
            "Interface language and reading direction.",
            "لغة الواجهة واتجاه القراءة.",
          )}
        >
          <div
            role="radiogroup"
            aria-label={t("Language", "اللغة")}
            className="flex flex-col gap-3 sm:flex-row"
          >
            {langOption("ar", "العربية", "من اليمين إلى اليسار")}
            {langOption("en", "English", "Left to right")}
          </div>
        </Section>

        <Section
          icon={<MonitorCog className="size-5" />}
          title={t("Display", "العرض")}
          description={t(
            "How the interface looks and moves.",
            "مظهر الواجهة وحركتها.",
          )}
        >
          <Switch
            checked={draft.reduceMotion}
            onChange={(v) => set("reduceMotion", v)}
            label={t("Reduce motion", "تقليل الحركة")}
            description={t(
              "Turn off reveal animations and transitions.",
              "إيقاف الحركات الانتقالية وتأثيرات الظهور.",
            )}
          />
          <Field
            label={t("Rows per table page", "عدد الصفوف في الجدول")}
            hint={t(
              "Applies the next time a table is opened.",
              "يُطبّق عند فتح الجدول في المرة القادمة.",
            )}
          >
            {(id, d) => (
              <div className="max-w-xs">
                <Select
                  id={id}
                  aria-describedby={d}
                  value={draft.pageSize}
                  onChange={(e) => set("pageSize", Number(e.target.value))}
                >
                  {[10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </Field>
          <p className="rounded-xl bg-beige px-4 py-3 text-xs text-muted">
            {t(
              "A dark theme is not available yet.",
              "الوضع الداكن غير متوفر حاليًا.",
            )}
          </p>
        </Section>

        <Section
          icon={<Bell className="size-5" />}
          title={t("Notifications", "الإشعارات")}
          description={t(
            "Choose what you would be notified about.",
            "اختر ما تريد أن تُبلَّغ به.",
          )}
        >
          <Switch
            checked={draft.notifications.submissions}
            onChange={(v) => setNotif("submissions", v)}
            label={t("New submissions", "مساهمات جديدة")}
            description={t(
              "When a contributor submits content for review.",
              "عندما يرسل مساهم محتوى للمراجعة.",
            )}
          />
          <Switch
            checked={draft.notifications.decisions}
            onChange={(v) => setNotif("decisions", v)}
            label={t("Review decisions", "قرارات المراجعة")}
            description={t(
              "When your submission is approved or rejected.",
              "عند قبول مساهمتك أو رفضها.",
            )}
          />
          <Switch
            checked={draft.notifications.mentions}
            onChange={(v) => setNotif("mentions", v)}
            label={t("Comments & mentions", "التعليقات والإشارات")}
            description={t(
              "When someone mentions you in a review note.",
              "عندما يشير إليك أحد في ملاحظة مراجعة.",
            )}
          />
          <Switch
            checked={draft.notifications.digest}
            onChange={(v) => setNotif("digest", v)}
            label={t("Weekly digest", "ملخص أسبوعي")}
            description={t(
              "A summary of archive activity every Sunday.",
              "ملخص لنشاط الأرشيف كل يوم أحد.",
            )}
          />
          <Field label={t("Delivery channel", "قناة الإرسال")}>
            {(id) => (
              <div className="max-w-xs">
                <Select
                  id={id}
                  value={draft.channel}
                  onChange={(e) =>
                    set("channel", e.target.value as Settings["channel"])
                  }
                >
                  <option value="in-app">
                    {t("In-app only", "داخل التطبيق فقط")}
                  </option>
                  <option value="email">
                    {t("Email and in-app", "البريد وداخل التطبيق")}
                  </option>
                </Select>
              </div>
            )}
          </Field>
        </Section>

        <Section
          icon={<UserCog className="size-5" />}
          title={t("Account preferences", "تفضيلات الحساب")}
          description={t(
            "Defaults that shape your workflow.",
            "إعدادات افتراضية لسير عملك.",
          )}
        >
          <Field label={t("Start page after login", "صفحة البداية بعد الدخول")}>
            {(id) => (
              <div className="max-w-xs">
                <Select
                  id={id}
                  value={draft.startPage}
                  onChange={(e) => set("startPage", e.target.value)}
                >
                  <option value="/dashboard">
                    {t("Dashboard overview", "نظرة عامة")}
                  </option>
                  <option value="/dashboard/villages">
                    {t("Village management", "إدارة القرى")}
                  </option>
                  <option value="/dashboard/reviews">
                    {t("Review queue", "قائمة المراجعة")}
                  </option>
                </Select>
              </div>
            )}
          </Field>
        </Section>

        <Section
          icon={<Database className="size-5" />}
          title={t("Data", "البيانات")}
          description={t(
            "Records are stored on the server.",
            "تُحفظ السجلات على الخادم.",
          )}
        >
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-accent/25 bg-accent-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink/80">
              {t(
                "Reload villages, records, users and logs from the server.",
                "إعادة تحميل القرى والسجلات والمستخدمين والسجل من الخادم.",
              )}
            </p>
            <Button
              variant="outline"
              className="shrink-0 text-accent-dark"
              icon={<RotateCcw className="size-4" />}
              onClick={() => setResetOpen(true)}
            >
              {t("Reload data", "إعادة تحميل البيانات")}
            </Button>
          </div>
        </Section>
      </div>

      {/* Save bar */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-[300] border-t border-stone-line bg-paper/95 backdrop-blur transition-transform duration-300 lg:start-72",
          dirty ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <p className="text-sm text-muted">
            {t("You have unsaved changes", "لديك تغييرات غير محفوظة")}
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setDraft(saved)}
              disabled={saving}
            >
              {t("Discard", "تجاهل")}
            </Button>
            <Button
              onClick={save}
              loading={saving}
              icon={<Save className="size-4" />}
            >
              {t("Save changes", "حفظ التغييرات")}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title={t("Reload data?", "إعادة تحميل البيانات؟")}
        description={t(
          "Everything is fetched again from the server. Saved changes are kept.",
          "يُعاد جلب كل شيء من الخادم، والتغييرات المحفوظة تبقى كما هي.",
        )}
        confirmLabel={t("Reload", "إعادة التحميل")}
        onConfirm={async () => {
          await reloadData();
          toast.success(t("Data reloaded from the server", "أُعيد تحميل البيانات من الخادم"));
        }}
      />
    </div>
  );
}
