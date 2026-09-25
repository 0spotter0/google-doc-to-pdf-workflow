// Raw <object>/<iframe> data URLs aren't rewritten with basePath, so prefix it.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function Home() {
  const pdf = `${basePath}/document.pdf`;
  return (
    <object
      data={pdf}
      type="application/pdf"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%" }}
    >
      {/* Fallback for browsers that won't inline-render PDFs */}
      <iframe
        src={pdf}
        title="Document"
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: 0 }}
      />
    </object>
  );
}
