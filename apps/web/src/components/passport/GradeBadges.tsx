import { useTranslations } from 'next-intl';
import type { BacteriaGrade, SomaticGrade } from '@milcow/shared';

const top = 'bg-[#e7f6ec] text-[#2f8f4e]';
const ok = 'bg-cream text-brand';

/** "세균 1A · 체세포 1등급" chips — green when it is the top grade */
export function GradeBadges({
  bacteria,
  somatic,
  className = '',
}: {
  bacteria: BacteriaGrade;
  somatic: SomaticGrade;
  className?: string;
}) {
  const t = useTranslations('Passport.grade');
  return (
    <span className={`flex flex-wrap gap-1.5 ${className}`}>
      <span
        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${bacteria === 'GRADE_1A' ? top : ok}`}
      >
        {t('bacteria', { grade: t(`b.${bacteria}`) })}
      </span>
      <span
        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${somatic === 'GRADE_1' ? top : ok}`}
      >
        {t('somatic', { grade: t(`s.${somatic}`) })}
      </span>
    </span>
  );
}
