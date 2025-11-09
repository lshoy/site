import { PostSummary } from "../../lib/content";
import { formatDisplayDate } from "../../lib/date-format";
import { GroupLabel } from "./group-label";

type PostMetaProps = Pick<PostSummary, "date" | "tags" | "series"> & {
  showTags?: boolean;
};

export function PostMeta({
  date,
  tags,
  series,
  showTags = true,
}: PostMetaProps) {
  const rows: MetaRow[] = [
    { label: "Date", value: formatDisplayDate(date, "Unscheduled") },
  ];
  if (series) {
    rows.push({ label: "Series", value: series });
  }

  return (
    <div className="post-meta">
      <dl className="post-meta-grid">
        {rows.map((row, index) => (
          <div key={`${row.label}-${index}`} className="post-meta-line">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      {showTags && tags.length ? (
        <div className="post-meta-tags">
          <GroupLabel groups={tags} />
        </div>
      ) : null}
    </div>
  );
}

type MetaRow = {
  label: string;
  value: string;
};
