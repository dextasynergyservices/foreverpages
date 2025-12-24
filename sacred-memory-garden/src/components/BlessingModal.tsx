import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { toast } from 'sonner';

interface BlessingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BlessingModal = ({ open, onOpenChange }: BlessingModalProps) => {
  const [selectedBlessing, setSelectedBlessing] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');

  const blessings = [
    {
      id: 'candle',
      icon: '🕊️',
      title: 'Prayer Candle',
      description: 'Light a virtual candle with a prayer',
      suggestedAmount: '10',
    },
    {
      id: 'rose',
      icon: '🌹',
      title: 'Memorial Rose',
      description: 'Send virtual roses with a message',
      suggestedAmount: '25',
    },
    {
      id: 'support',
      icon: '🤲',
      title: 'Family Comfort',
      description: 'Financial support for the family',
      suggestedAmount: '50',
    },
  ];

  const handleSendBlessing = () => {
    if (!selectedBlessing || !amount || !name) {
      toast.error('Please fill in all fields');
      return;
    }

    // Here you would integrate with payment processing
    toast.success('Your blessing has been sent to heaven ✨', {
      description: 'Thank you for your kindness and support',
    });

    // Reset form
    setSelectedBlessing(null);
    setAmount('');
    setMessage('');
    setName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] glass-effect border-primary/20">
        <DialogHeader>
          <DialogTitle className="font-heading text-3xl text-center mb-2">
            Send a Blessing
          </DialogTitle>
          <p className="font-body text-center text-muted-foreground text-sm">
            Your blessing brings comfort to those who mourn
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Blessing Options */}
          <div className="space-y-3">
            <Label className="font-body font-semibold">Choose Your Blessing</Label>
            <div className="grid gap-3">
              {blessings.map(blessing => (
                <button
                  key={blessing.id}
                  onClick={() => {
                    setSelectedBlessing(blessing.id);
                    setAmount(blessing.suggestedAmount);
                  }}
                  className={`p-4 rounded-xl border-2 transition-smooth text-left ${
                    selectedBlessing === blessing.id
                      ? 'border-primary bg-primary/10 shadow-soft'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{blessing.icon}</span>
                    <div className="flex-1">
                      <div className="font-body font-semibold">{blessing.title}</div>
                      <div className="text-sm text-muted-foreground">{blessing.description}</div>
                    </div>
                    <div className="font-body text-sm text-primary font-semibold">
                      ${blessing.suggestedAmount}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedBlessing && (
            <div className="space-y-4 animate-fade-in-up">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="font-body">
                  Your Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="font-body"
                />
              </div>

              {/* Blessing Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="font-body">
                  Blessing Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="font-body"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message" className="font-body">
                  Your Message (Optional)
                </Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Share your prayers and memories..."
                  className="font-body min-h-[100px]"
                />
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSendBlessing}
                className="w-full bg-primary hover:bg-primary/90 text-white shadow-glow font-body font-semibold py-6 text-lg"
              >
                Send Your Blessing ✨
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlessingModal;
