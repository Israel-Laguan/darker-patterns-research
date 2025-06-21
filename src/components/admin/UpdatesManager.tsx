import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Update } from '@/lib/firestore/schemas';
import React from 'react';

interface UpdatesManagerProps {
  updates: Update<Date>[];
  onUpdateChange: (updates: Update<Date>[]) => void;
}

const UpdatesManager: React.FC<UpdatesManagerProps> = ({ updates, onUpdateChange }) => {
  const handleAddUpdate = () => {
    const newUpdate: Update<Date> = {
      id: Date.now().toString(),
      title: '',
      date: new Date(),
      description: '',
      iconName: 'info',
    };
    const newUpdates = [...updates, newUpdate];
    onUpdateChange(newUpdates);
  };

  const handleRemoveUpdate = (index: number) => {
    const newUpdates = updates.filter((_, i) => i !== index);
    onUpdateChange(newUpdates);
  };

  const handleUpdateFieldChange = (index: number, field: keyof Update<Date>, value: string) => {
    const newUpdates = [...updates];
    if (field === 'date') return; // Do not handle date changes here for now
    newUpdates[index] = { ...newUpdates[index], [field]: value };
    onUpdateChange(newUpdates);
  };

  return (
    <div>
      <h3 className="text-lg font-medium">Recent Updates</h3>
      {updates.map((update, index) => (
        <div key={update.id} className="my-2 rounded-md border p-4">
          <Input
            placeholder="Title"
            value={update.title}
            onChange={(e) => handleUpdateFieldChange(index, 'title', e.target.value)}
            className="mb-2"
          />
          <Textarea
            placeholder="Description"
            value={update.description}
            onChange={(e) => handleUpdateFieldChange(index, 'description', e.target.value)}
            className="mb-2"
          />
          <Button className="btn-base" variant="destructive" onClick={() => handleRemoveUpdate(index)}>
            Remove
          </Button>
        </div>
      ))}
      <Button onClick={handleAddUpdate}>Add Update</Button>
    </div>
  );
};

export default UpdatesManager;
