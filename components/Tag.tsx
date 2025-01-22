// import Link from "next/link";

interface Props {
  text: string;
}

const Tag = ({ text }: Props) => {
  return (
    <span
      // href={`/categories/${text}`}
      className="mr-3 text-sm font-medium uppercase"
    >
      {text.split(" ").join("-")}
    </span>
  );
};

export default Tag;
