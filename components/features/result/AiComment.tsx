interface AiCommentProps {
  comment: string;
}

export function AiComment({ comment }: AiCommentProps) {
  return (
    <blockquote
      style={{
        borderLeft: "4px solid #4299e1",
        paddingLeft: "1rem",
        margin: "1rem 0",
        fontStyle: "italic",
        color: "#4a5568",
      }}
    >
      {comment}
    </blockquote>
  );
}
