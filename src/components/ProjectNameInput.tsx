
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProjectNameInputProps {
  value: string;
  onChange: (value: string) => void;
  areaName: string;
}

const ProjectNameInput = ({ value, onChange, areaName }: ProjectNameInputProps) => {
  return (
    <div className="mb-6">
      <Label htmlFor={`project-name-${areaName}`} className="text-sierra-teal font-medium">
        Nombre del Proyecto *
      </Label>
      <Input
        id={`project-name-${areaName}`}
        type="text"
        placeholder="Ingresa el nombre del proyecto..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 focus:ring-sierra-teal focus:border-sierra-teal"
        required
      />
    </div>
  );
};

export default ProjectNameInput;
