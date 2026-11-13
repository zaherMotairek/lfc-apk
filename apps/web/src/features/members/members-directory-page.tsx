import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../components/ui/page-header';
import { resolveMediaUrl } from '../../lib/media-url';

type DirectoryMember = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  city: string | null;
  favoritePlayer: string | null;
  memberSince: string;
};

export function MembersDirectoryPage() {
  const { accessToken } = useAuth();
  const query = useQuery({
    queryKey: ['members-directory'],
    queryFn: () => apiRequest<DirectoryMember[]>('/members/directory', { token: accessToken }),
    enabled: Boolean(accessToken),
  });

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Community"
        title="Member directory"
        description="Supporters who chose to appear here. Update your profile to opt in or out."
      />

      <Link to="/app/profile" className="kop-btn-secondary inline-block !text-sm">
        Privacy settings →
      </Link>

      {query.isLoading ? <p className="text-black/50">Loading…</p> : null}
      {query.error ? <p className="text-lfc-red">Unable to load directory.</p> : null}

      <ul className="grid gap-3 sm:grid-cols-2">
        {(query.data ?? []).map((member) => (
          <li key={member.id} className="kop-card flex gap-3 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/5 text-lg font-bold text-lfc-red">
              {member.avatarUrl ? (
                <img src={resolveMediaUrl(member.avatarUrl)} alt="" className="h-full w-full object-cover" />
              ) : (
                member.displayName.slice(0, 1)
              )}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-ink">{member.displayName}</div>
              {member.city ? <div className="text-xs text-black/50">{member.city}</div> : null}
              {member.favoritePlayer ? (
                <div className="text-xs text-black/45">Favourite: {member.favoritePlayer}</div>
              ) : null}
              <div className="mt-1 text-[10px] uppercase tracking-wide text-black/35">
                Since {new Date(member.memberSince).toLocaleDateString()}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {!query.isLoading && !query.data?.length ? (
        <p className="text-sm text-black/50">No members have opted in yet. Be the first from your profile.</p>
      ) : null}
    </section>
  );
}
