import { StyleSheet } from "@react-pdf/renderer";

export const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1f2937" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, borderBottomWidth: 2, borderBottomColor: "#1e3a8a", paddingBottom: 12 },
  brand: { fontSize: 16, fontWeight: 700, color: "#1e3a8a" },
  muted: { color: "#6b7280" },
  title: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#6b7280", marginBottom: 16 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginBottom: 6, color: "#1e3a8a" },
  row: { flexDirection: "row", marginBottom: 4 },
  col: { flex: 1 },
  label: { color: "#6b7280", fontSize: 9 },
  value: { fontSize: 10, fontWeight: 700 },
  table: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingVertical: 6, paddingHorizontal: 8 },
  tableHeader: { backgroundColor: "#f3f4f6", fontWeight: 700 },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: "#9ca3af", borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 8 },
  demoBanner: { backgroundColor: "#fef3c7", color: "#92400e", padding: 6, fontSize: 8, textAlign: "center", marginBottom: 12, borderRadius: 4 },
});
