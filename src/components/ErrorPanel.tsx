interface Props {
  errors: string[];
}

export function ErrorPanel({ errors }: Props) {
  if (errors.length === 0) return null;
  return (
    <div className="errors" role="alert">
      {errors.map((error, i) => (
        <p key={i} className="error-item">
          {error}
        </p>
      ))}
    </div>
  );
}