import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { EditableText } from '../cms/editable-text';
import { getCtaContent } from '../cms/get-cta-content';
import { InlineEditToolbar } from '../cms/inline-edit-toolbar';
import { CmsInlineEditProvider, useCmsInlineEdit } from '../cms/use-cms-inline-edit';

type PackageType = 'LIGHT' | 'FULL';

const DEFAULT_APPLY_PAGE = {
  badge: '2026/27 Season',
  title: 'OLSC Lebanon Branch Membership',
  subtitle: 'Official Liverpool Supporters Club — Lebanon. Memberships valid until 30 June 2027.',
  formTitle: 'Membership application',
  formIntro: 'Complete this form, then transfer the fee via Whish Money or OMT Pay.',
  fullTitle: 'Full Membership — $25',
  fullBody:
    'Scarf, Anfield ticket access, UCL away tickets (subject to availability), plus all Light benefits.',
  lightTitle: 'Light Membership — $10',
  lightBody: 'Membership card, branch certificate, competitions eligibility, and voting rights.',
  paymentAgreement:
    'I agree to settle the package amount through money transfer (Whish Money or OMT Pay) and understand that my package will not be activated before payment has been made.',
  successTitle: 'Application received',
  successBody:
    'Thank you for applying for OLSC Lebanon membership 2026/27. Your application will only be considered active once payment has been completed and confirmed by the committee.',
  successNote: "We'll be in touch to arrange collection of your membership package.",
};

const DEFAULT_APPLY_PAYMENT = {
  payTitle: 'How to pay',
  payIntro: 'Transfer via Whish Money or OMT Pay to:',
  payName: 'Mohammad Abdallah',
  payPhone: '+961 70 704 292',
  payExtra: 'UK bank account details available upon request.',
  notesTitle: 'Important notes',
  notesBody:
    'Applications close on 31 August 2026.\nAll members — including previous ones — must re-apply for 2026/27.\nMembership is active only after payment confirmation.',
};

function MembershipApplyPageContent() {
  const { getSection, updateContent } = useCmsInlineEdit();
  const applyPage = getCtaContent(getSection, 'applyPage', DEFAULT_APPLY_PAGE);
  const applyPayment = getCtaContent(getSection, 'applyPayment', DEFAULT_APPLY_PAYMENT);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [packageType, setPackageType] = useState<PackageType>('FULL');
  const [previousOlscId, setPreviousOlscId] = useState('');
  const [isOfficialLfcMember, setIsOfficialLfcMember] = useState<'yes' | 'no'>('no');
  const [lfcId, setLfcId] = useState('');
  const [paymentAgreed, setPaymentAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiRequest('/membership-applications', {
        method: 'POST',
        body: {
          fullName,
          email,
          address,
          phoneNumber,
          packageType,
          previousOlscId: previousOlscId.trim() || undefined,
          isOfficialLfcMember: isOfficialLfcMember === 'yes',
          lfcId: isOfficialLfcMember === 'yes' ? lfcId.trim() : undefined,
          paymentAgreed,
        },
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit application.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="pb-24 md:pb-28">
        <InlineEditToolbar />
        <section className="kop-container py-16 md:py-24">
          <div className="kop-card mx-auto max-w-2xl p-8 text-center md:p-10">
            <div className="text-4xl">✅</div>
            <EditableText
              as="h1"
              className="mt-4 block text-3xl font-extrabold text-ink"
              value={applyPage.successTitle as string}
              onSave={(value) => updateContent('CTA', { successTitle: value }, 'applyPage')}
            />
            <EditableText
              as="p"
              multiline
              className="mt-4 block text-black/60"
              value={applyPage.successBody as string}
              onSave={(value) => updateContent('CTA', { successBody: value }, 'applyPage')}
            />
            <EditableText
              as="p"
              multiline
              className="mt-3 block text-sm text-black/45"
              value={applyPage.successNote as string}
              onSave={(value) => updateContent('CTA', { successNote: value }, 'applyPage')}
            />
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/membership" className="kop-btn-secondary">
                Back to membership
              </Link>
              <Link to="/" className="kop-btn-primary">
                Home
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-28">
      <InlineEditToolbar />
      <section className="relative overflow-hidden border-b border-black/5">
        <div className="absolute inset-0 kop-gradient-hero opacity-[0.06]" />
        <div className="kop-container relative py-12 md:py-16">
          <div className="max-w-3xl">
            <EditableText
              as="p"
              className="kop-badge-red mb-4 inline-block"
              value={applyPage.badge as string}
              onSave={(value) => updateContent('CTA', { badge: value }, 'applyPage')}
            />
            <EditableText
              as="h1"
              className="block text-4xl font-extrabold tracking-tight text-ink md:text-5xl"
              value={applyPage.title as string}
              onSave={(value) => updateContent('CTA', { title: value }, 'applyPage')}
            />
            <EditableText
              as="p"
              multiline
              className="mt-5 block max-w-2xl text-lg leading-relaxed text-black/60"
              value={applyPage.subtitle as string}
              onSave={(value) => updateContent('CTA', { subtitle: value }, 'applyPage')}
            />
          </div>
        </div>
      </section>

      <section className="kop-container py-12">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_320px]">
          <form onSubmit={onSubmit} className="kop-card space-y-6 p-6 md:p-8">
            <div>
              <EditableText
                as="h2"
                className="text-xl font-bold text-ink"
                value={applyPage.formTitle as string}
                onSave={(value) => updateContent('CTA', { formTitle: value }, 'applyPage')}
              />
              <EditableText
                as="p"
                multiline
                className="mt-1 block text-sm text-black/55"
                value={applyPage.formIntro as string}
                onSave={(value) => updateContent('CTA', { formIntro: value }, 'applyPage')}
              />
            </div>

            <label className="block text-sm font-medium">
              Full name *
              <input
                className="kop-input mt-1"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </label>

            <label className="block text-sm font-medium">
              Email *
              <input
                type="email"
                className="kop-input mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="block text-sm font-medium">
              Address *
              <input
                className="kop-input mt-1"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </label>

            <label className="block text-sm font-medium">
              Phone number *
              <input
                className="kop-input mt-1"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 70 704 292 or +961 70 704 292"
                required
              />
            </label>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">Choose package *</legend>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/10 p-4">
                <input
                  type="radio"
                  name="packageType"
                  value="FULL"
                  checked={packageType === 'FULL'}
                  onChange={() => setPackageType('FULL')}
                  className="mt-1"
                />
                <span>
                  <EditableText
                    as="span"
                    className="font-bold text-ink"
                    value={applyPage.fullTitle as string}
                    onSave={(value) => updateContent('CTA', { fullTitle: value }, 'applyPage')}
                  />
                  <EditableText
                    as="span"
                    multiline
                    className="mt-1 block text-sm text-black/55"
                    value={applyPage.fullBody as string}
                    onSave={(value) => updateContent('CTA', { fullBody: value }, 'applyPage')}
                  />
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/10 p-4">
                <input
                  type="radio"
                  name="packageType"
                  value="LIGHT"
                  checked={packageType === 'LIGHT'}
                  onChange={() => setPackageType('LIGHT')}
                  className="mt-1"
                />
                <span>
                  <EditableText
                    as="span"
                    className="font-bold text-ink"
                    value={applyPage.lightTitle as string}
                    onSave={(value) => updateContent('CTA', { lightTitle: value }, 'applyPage')}
                  />
                  <EditableText
                    as="span"
                    multiline
                    className="mt-1 block text-sm text-black/55"
                    value={applyPage.lightBody as string}
                    onSave={(value) => updateContent('CTA', { lightBody: value }, 'applyPage')}
                  />
                </span>
              </label>
            </fieldset>

            <label className="block text-sm font-medium">
              OLSC Lebanon Branch Member ID (for returning members only)
              <input
                className="kop-input mt-1"
                value={previousOlscId}
                onChange={(e) => setPreviousOlscId(e.target.value)}
                placeholder="e.g. 001"
              />
            </label>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">
                Are you an Official Liverpool FC Member? (All Red Membership) *
              </legend>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="lfcMember"
                    value="yes"
                    checked={isOfficialLfcMember === 'yes'}
                    onChange={() => setIsOfficialLfcMember('yes')}
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="lfcMember"
                    value="no"
                    checked={isOfficialLfcMember === 'no'}
                    onChange={() => setIsOfficialLfcMember('no')}
                  />
                  No
                </label>
              </div>
            </fieldset>

            {isOfficialLfcMember === 'yes' ? (
              <label className="block text-sm font-medium">
                LFC Supporter ID number *
                <input
                  className="kop-input mt-1"
                  value={lfcId}
                  onChange={(e) => setLfcId(e.target.value)}
                  required
                />
              </label>
            ) : null}

            <label className="flex items-start gap-3 rounded-xl border border-lfc-red/20 bg-lfc-red/5 p-4 text-sm">
              <input
                type="checkbox"
                checked={paymentAgreed}
                onChange={(e) => setPaymentAgreed(e.target.checked)}
                required
                className="mt-1"
              />
              <EditableText
                as="span"
                multiline
                value={applyPage.paymentAgreement as string}
                onSave={(value) => updateContent('CTA', { paymentAgreement: value }, 'applyPage')}
              />
            </label>

            {error ? (
              <div className="rounded-xl border border-lfc-red/20 bg-lfc-red/5 px-4 py-3 text-sm text-lfc-red">
                {error}
              </div>
            ) : null}

            <button type="submit" disabled={loading} className="kop-btn-primary w-full">
              {loading ? 'Submitting…' : 'Submit application'}
            </button>
          </form>

          <aside className="space-y-4">
            <div className="kop-card p-5">
              <EditableText
                as="h2"
                className="font-bold text-ink"
                value={applyPayment.payTitle as string}
                onSave={(value) => updateContent('CTA', { payTitle: value }, 'applyPayment')}
              />
              <EditableText
                as="p"
                multiline
                className="mt-3 block text-sm leading-relaxed text-black/60"
                value={applyPayment.payIntro as string}
                onSave={(value) => updateContent('CTA', { payIntro: value }, 'applyPayment')}
              />
              <EditableText
                as="p"
                className="mt-2 block text-sm font-bold text-ink"
                value={applyPayment.payName as string}
                onSave={(value) => updateContent('CTA', { payName: value }, 'applyPayment')}
              />
              <EditableText
                as="p"
                className="block text-sm text-black/60"
                value={applyPayment.payPhone as string}
                onSave={(value) => updateContent('CTA', { payPhone: value }, 'applyPayment')}
              />
              <EditableText
                as="p"
                multiline
                className="mt-3 block text-xs text-black/45"
                value={applyPayment.payExtra as string}
                onSave={(value) => updateContent('CTA', { payExtra: value }, 'applyPayment')}
              />
            </div>

            <div className="kop-card p-5 text-sm text-black/60">
              <EditableText
                as="p"
                className="font-semibold text-ink"
                value={applyPayment.notesTitle as string}
                onSave={(value) => updateContent('CTA', { notesTitle: value }, 'applyPayment')}
              />
              <EditableText
                as="div"
                multiline
                className="mt-3 block whitespace-pre-wrap leading-relaxed"
                value={applyPayment.notesBody as string}
                onSave={(value) => updateContent('CTA', { notesBody: value }, 'applyPayment')}
              />
            </div>

            <Link to="/membership" className="kop-btn-secondary block text-center">
              ← Back to membership info
            </Link>
          </aside>
        </div>
      </section>
    </div>
  );
}

export function MembershipApplyPage() {
  return (
    <CmsInlineEditProvider pageCode="MEMBERSHIP">
      <MembershipApplyPageContent />
    </CmsInlineEditProvider>
  );
}
