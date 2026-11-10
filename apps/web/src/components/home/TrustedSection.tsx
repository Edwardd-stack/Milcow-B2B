import { Dancing_Script, Great_Vibes, Pacifico, Satisfy } from 'next/font/google';
import { useTranslations } from 'next-intl';
import { Container } from '@/components/ui/Container';

/*
 * Client "logos" are drawn as text in script fonts (like the template), so no image files are needed.
 * The companies are fictional demo customers — not real brands.
 * next/font downloads each font at build time and serves it from our own domain.
 */
const pacifico = Pacifico({ weight: '400', subsets: ['latin'] });
const dancing = Dancing_Script({ weight: '700', subsets: ['latin'] });
const satisfy = Satisfy({ weight: '400', subsets: ['latin'] });
const greatVibes = Great_Vibes({ weight: '400', subsets: ['latin'] });

/*
 * The fonts come in one weight each and are not equally thick, so a thin outline (text-stroke)
 * evens them out: thin fonts get more, heavy ones less → all four look equally bold.
 */
const CLIENTS = [
  {
    name: 'Hanbit Dairy',
    font: pacifico.className,
    size: 'text-[26px] sm:text-[30px]',
    stroke: '0.3px',
  },
  {
    name: 'Seoul Bakehouse',
    font: dancing.className,
    size: 'text-[30px] sm:text-[36px]',
    stroke: '0.7px',
  },
  {
    name: 'Haneul Café',
    font: satisfy.className,
    size: 'text-[30px] sm:text-[36px]',
    stroke: '1px',
  },
  {
    name: 'Greenfield Foods',
    font: greatVibes.className,
    size: 'text-[34px] sm:text-[42px]',
    stroke: '1.2px',
  },
] as const;

/** "Trusted by 300+ businesses" + a row of client wordmarks */
export function TrustedSection() {
  const t = useTranslations('Trusted');

  return (
    <section className="pb-20 lg:pb-24">
      <Container>
        <h2 className="text-center text-xl font-medium text-heading sm:text-2xl lg:text-[30px]">
          {t.rich('title', { n: (chunks) => <span className="text-brand">{chunks}</span> })}
        </h2>
        <ul className="mt-8 grid grid-cols-1 items-center gap-x-6 gap-y-7 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
          {CLIENTS.map((client) => (
            <li key={client.name} className="text-center">
              <span
                style={{ WebkitTextStroke: `${client.stroke} currentColor` }}
                className={`inline-block cursor-default whitespace-nowrap text-[#8f959e] select-none transition-colors duration-300 hover:text-brand-dark ${client.font} ${client.size}`}
              >
                {client.name}
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
