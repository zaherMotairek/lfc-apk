import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/auth-context';
import { apiRequest } from '../../lib/api';
import type { CmsPage, CmsSection } from './cms-types';

type CmsInlineEditContextValue = {
  canEdit: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  page: CmsPage | null;
  getSection: (type: string, block?: string) => CmsSection | undefined;
  updateSection: (type: string, patch: Partial<CmsSection>, block?: string) => void;
  updateContent: (
    type: string,
    patch: Record<string, unknown>,
    block?: string,
  ) => void;
  save: () => Promise<void>;
  reset: () => void;
};

const CmsInlineEditContext = createContext<CmsInlineEditContextValue | null>(null);

function findSection(sections: CmsSection[], type: string, block?: string) {
  if (block) {
    return sections.find(
      (section) =>
        section.type === type &&
        (section.content as { block?: string } | null | undefined)?.block === block,
    );
  }
  return sections.find((section) => section.type === type);
}

function nextSortOrder(sections: CmsSection[]) {
  return sections.reduce((max, section) => Math.max(max, section.sortOrder ?? 0), 0) + 1;
}

function createDraftSection(
  type: string,
  block: string | undefined,
  patch: {
    title?: string | null;
    subtitle?: string | null;
    content?: Record<string, unknown>;
    imageUrl?: string | null;
    sortOrder?: number;
  },
): CmsSection {
  return {
    id: `draft-${type}-${block ?? 'default'}-${Date.now()}`,
    type,
    title: patch.title ?? null,
    subtitle: patch.subtitle ?? null,
    content: {
      ...(block ? { block } : {}),
      ...(patch.content ?? {}),
    },
    imageUrl: patch.imageUrl ?? null,
    sortOrder: patch.sortOrder ?? 1,
    isEnabled: true,
  };
}

export function CmsInlineEditProvider({
  pageCode,
  children,
}: {
  pageCode: string;
  children: ReactNode;
}) {
  const { accessToken, user } = useAuth();
  const queryClient = useQueryClient();
  const wantsEdit = Boolean(
    accessToken && user?.permissions.includes('MANAGE_CONTENT'),
  );

  const adminQuery = useQuery({
    queryKey: ['admin-cms', pageCode],
    queryFn: () => apiRequest<CmsPage>(`/admin/cms/pages/${pageCode}`, { token: accessToken }),
    enabled: wantsEdit,
    retry: false,
  });

  const canEdit = wantsEdit && !adminQuery.isError;

  const publicQuery = useQuery({
    queryKey: ['cms-page', pageCode],
    queryFn: () => apiRequest<CmsPage>(`/cms/pages/${pageCode}`),
    enabled: !canEdit,
  });

  const sourcePage = canEdit ? adminQuery.data : publicQuery.data;
  const [draft, setDraft] = useState<CmsPage | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (sourcePage) {
      setDraft(sourcePage);
      setIsDirty(false);
    }
  }, [sourcePage]);

  const saveMutation = useMutation({
    mutationFn: async (page: CmsPage) =>
      apiRequest<{ message: string; page: CmsPage }>(`/admin/cms/pages/${pageCode}`, {
        method: 'PUT',
        token: accessToken,
        body: {
          title: page.title,
          isPublished: page.isPublished,
          sections: page.sections.map((section, index) => ({
            type: section.type,
            title: section.title,
            subtitle: section.subtitle,
            content: section.content ?? {},
            imageUrl: section.imageUrl,
            sortOrder: section.sortOrder ?? index + 1,
            isEnabled: section.isEnabled ?? true,
          })),
        },
      }),
    onSuccess: (result) => {
      setDraft(result.page);
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['cms-page', pageCode] });
      queryClient.invalidateQueries({ queryKey: ['admin-cms', pageCode] });
    },
  });

  const getSection = useCallback(
    (type: string, block?: string) => {
      if (!draft) {
        return undefined;
      }
      return findSection(draft.sections, type, block);
    },
    [draft],
  );

  const updateSection = useCallback(
    (type: string, patch: Partial<CmsSection>, block?: string) => {
      setDraft((prev) => {
        if (!prev) {
          return prev;
        }
        const existing = findSection(prev.sections, type, block);
        if (!existing) {
          const created = createDraftSection(type, block, {
            title: patch.title,
            subtitle: patch.subtitle,
            content:
              patch.content && typeof patch.content === 'object'
                ? (patch.content as Record<string, unknown>)
                : undefined,
            imageUrl: patch.imageUrl,
          });
          created.sortOrder = nextSortOrder(prev.sections);
          return { ...prev, sections: [...prev.sections, created] };
        }
        const sections = prev.sections.map((section) => {
          const matchesType = section.type === type;
          const matchesBlock =
            !block ||
            (section.content as { block?: string } | null | undefined)?.block === block;
          if (!matchesType || !matchesBlock) {
            return section;
          }
          return {
            ...section,
            ...patch,
            content: patch.content
              ? { ...(section.content ?? {}), ...patch.content }
              : section.content,
          };
        });
        return { ...prev, sections };
      });
      setIsDirty(true);
    },
    [],
  );

  const updateContent = useCallback(
    (type: string, patch: Record<string, unknown>, block?: string) => {
      setDraft((prev) => {
        if (!prev) {
          return prev;
        }
        const existing = findSection(prev.sections, type, block);
        if (!existing) {
          const created = createDraftSection(type, block, { content: patch });
          created.sortOrder = nextSortOrder(prev.sections);
          return { ...prev, sections: [...prev.sections, created] };
        }
        const sections = prev.sections.map((section) => {
          const matchesType = section.type === type;
          const matchesBlock =
            !block ||
            (section.content as { block?: string } | null | undefined)?.block === block;
          if (!matchesType || !matchesBlock) {
            return section;
          }
          return {
            ...section,
            content: { ...(section.content ?? {}), ...patch },
          };
        });
        return { ...prev, sections };
      });
      setIsDirty(true);
    },
    [],
  );

  const save = useCallback(async () => {
    if (!draft || !canEdit) {
      return;
    }
    await saveMutation.mutateAsync(draft);
  }, [canEdit, draft, saveMutation]);

  const reset = useCallback(() => {
    if (sourcePage) {
      setDraft(sourcePage);
      setIsDirty(false);
    }
  }, [sourcePage]);

  const value = useMemo(
    () => ({
      canEdit,
      isLoading: canEdit ? adminQuery.isLoading : publicQuery.isLoading,
      isSaving: saveMutation.isPending,
      isDirty,
      page: draft,
      getSection,
      updateSection,
      updateContent,
      save,
      reset,
    }),
    [
      adminQuery.isLoading,
      canEdit,
      draft,
      getSection,
      isDirty,
      publicQuery.isLoading,
      reset,
      save,
      saveMutation.isPending,
      updateContent,
      updateSection,
    ],
  );

  return (
    <CmsInlineEditContext.Provider value={value}>{children}</CmsInlineEditContext.Provider>
  );
}

export function useCmsInlineEdit() {
  const context = useContext(CmsInlineEditContext);
  if (!context) {
    throw new Error('useCmsInlineEdit must be used within CmsInlineEditProvider');
  }
  return context;
}
