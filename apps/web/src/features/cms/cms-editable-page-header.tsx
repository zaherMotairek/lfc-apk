import { PageHeader } from '../../components/ui/page-header';
import { EditableText } from './editable-text';
import { useCmsInlineEdit } from './use-cms-inline-edit';

type CmsEditablePageHeaderProps = {
  fallbackEyebrow?: string;
  fallbackTitle: string;
  fallbackDescription?: string;
  action?: React.ReactNode;
  backTo?: string;
  backLabel?: string;
};

export function CmsEditablePageHeader({
  fallbackEyebrow,
  fallbackTitle,
  fallbackDescription,
  action,
  backTo,
  backLabel,
}: CmsEditablePageHeaderProps) {
  const { getSection, updateSection, updateContent } = useCmsInlineEdit();
  const hero = getSection('HERO');
  const heroContent = (hero?.content ?? {}) as { eyebrow?: string };

  return (
    <PageHeader
      backTo={backTo}
      backLabel={backLabel}
      action={action}
      eyebrow={
        fallbackEyebrow !== undefined ? (
          <EditableText
            as="span"
            className="kop-badge-red mb-0 inline-block"
            value={heroContent.eyebrow ?? fallbackEyebrow}
            onSave={(value) => updateContent('HERO', { eyebrow: value })}
          />
        ) : undefined
      }
      title={
        <EditableText
          as="span"
          className="block"
          value={hero?.title ?? fallbackTitle}
          onSave={(value) => updateSection('HERO', { title: value })}
        />
      }
      description={
        fallbackDescription !== undefined || hero?.subtitle ? (
          <EditableText
            as="span"
            multiline
            className="block"
            value={hero?.subtitle ?? fallbackDescription ?? ''}
            onSave={(value) => updateSection('HERO', { subtitle: value })}
          />
        ) : undefined
      }
    />
  );
}
