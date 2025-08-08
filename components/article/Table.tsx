interface TableData {
  header: string[];
  body: string[][];
};

export default function Table({ data }: { data: TableData }) {
  return (
    <table className="my-4 w-full px-5">
      <thead>
        <tr className="rounded-lg bg-primary-300 dark:bg-primary-600">
          {
            data.header.map((h, i) => <td key={i} className={`p-3 text-center ${i === 0 ? "rounded-tl-lg" : i === data.header.length - 1 ? "rounded-tr-lg" : ""}`}>{h}</td>)
          }
        </tr>
      </thead>
      <tbody>
        {
          data.body.map((r, i) => 
            <tr key={i} className={i & 1 ? "bg-gray-200 dark:bg-gray-900" : "bg-gray-100 dark:bg-gray-800"}>{
              r.map((c, j) => <td key={j} className="p-3 text-center">{c}</td>)
            }</tr>)
        }
      </tbody>

    </table>
  );
}
