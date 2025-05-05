import { connect, data } from "@/lib/mongodb";

export default async function handler(req, res) {
  try {
    await connect();

    const steps = [
        { id: 0, name: 'first' },
        { id: 1, name: 'second' },
        { id: 2, name: 'third' }
      ];
    const checkboxes = [
        {id: '3', name: 'is_split'},
        {id: '4', name: 'no_line'}
    ]  

    res.status(200).json({ success: true, steps: steps.map((col) => (col.id, col.name)), checkboxes: checkboxes.map((col) => (col.id, col.name))} );
  } catch (error) {
    console.error("Connection failed:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {

  }
}