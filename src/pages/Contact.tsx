import { useState } from 'react';
import { Button } from '@/components/ui/button';

const Contact = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // for now just log (backend can be added later)
    console.log('Contact Form Submitted:', form);

    alert('Thanks for reaching out! We will get back to you soon.');

    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
      <p className="text-muted-foreground mb-8">
        Have questions, feedback, or need support? Fill out the form below and
        we’ll get back to you.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            required
            value={form.name}
            onChange={handleChange}
            className="w-full rounded-md border px-3 py-2 bg-background"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            required
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-md border px-3 py-2 bg-background"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Message</label>
          <textarea
            name="message"
            rows={5}
            required
            value={form.message}
            onChange={handleChange}
            className="w-full rounded-md border px-3 py-2 bg-background"
          />
        </div>

        <Button type="submit">Send Message</Button>
      </form>
    </div>
  );
};

export default Contact;
