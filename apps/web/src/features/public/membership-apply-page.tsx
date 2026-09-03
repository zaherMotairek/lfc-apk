import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api';

type PackageType = 'LIGHT' | 'FULL';

export function MembershipApplyPage() {
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
        <section className="kop-container py-16 md:py-24">
          <div className="kop-card mx-auto max-w-2xl p-8 text-center md:p-10">
            <div className="text-4xl">✅</div>
            <h1 className="mt-4 text-3xl font-extrabold text-ink">Application received</h1>
            <p className="mt-4 text-black/60">
              Thank you for applying for OLSC Lebanon membership 2026/27. Your application will
              only be considered active once payment has been completed and confirmed by the
              committee.
            </p>
            <p className="mt-3 text-sm text-black/45">
              We&apos;ll be in touch to arrange collection of your membership package.
            </p>
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
      <section className="relative overflow-hidden border-b border-black/5">
        <div className="absolute inset-0 kop-gradient-hero opacity-[0.06]" />
        <div className="kop-container relative py-12 md:py-16">
          <div className="max-w-3xl">
            <p className="kop-badge-red mb-4">2026/27 Season</p>
            <h1 className="text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
              OLSC Lebanon Branch Membership
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-black/60">
              Official Liverpool Supporters Club — Lebanon. Memberships valid until 30 June 2027.
            </p>
          </div>
        </div>
      </section>

      <section className="kop-container py-12">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_320px]">
          <form onSubmit={onSubmit} className="kop-card space-y-6 p-6 md:p-8">
            <div>
              <h2 className="text-xl font-bold text-ink">Membership application</h2>
              <p className="mt-1 text-sm text-black/55">
                Complete this form, then transfer the fee via Whish Money or OMT Pay.
              </p>
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
                  <span className="font-bold text-ink">Full Membership — $25</span>
                  <span className="mt-1 block text-sm text-black/55">
                    Scarf, Anfield ticket access, UCL away tickets (subject to availability), plus
                    all Light benefits.
                  </span>
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
                  <span className="font-bold text-ink">Light Membership — $10</span>
                  <span className="mt-1 block text-sm text-black/55">
                    Membership card, branch certificate, competitions eligibility, and voting rights.
                  </span>
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
              <span>
                I agree to settle the package amount through money transfer (Whish Money or OMT Pay)
                and understand that my package will not be activated before payment has been made.
              </span>
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
              <h2 className="font-bold text-ink">How to pay</h2>
              <p className="mt-3 text-sm leading-relaxed text-black/60">
                Transfer via <strong>Whish Money</strong> or <strong>OMT Pay</strong> to:
              </p>
              <p className="mt-2 text-sm font-bold text-ink">Mohammad Abdallah</p>
              <p className="text-sm text-black/60">+961 70 704 292</p>
              <p className="mt-3 text-xs text-black/45">
                UK bank account details available upon request.
              </p>
            </div>

            <div className="kop-card p-5 text-sm text-black/60">
              <p className="font-semibold text-ink">Important notes</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Applications close on 31 August 2026.</li>
                <li>All members — including previous ones — must re-apply for 2026/27.</li>
                <li>Membership is active only after payment confirmation.</li>
              </ul>
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
