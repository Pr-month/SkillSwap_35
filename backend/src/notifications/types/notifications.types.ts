export type TNotificationPayload = {
  type: 'newRequest' | 'requestAccepted' | 'requestDeclined';
  skillTitle: string;
  fromUser: {
    id: string;
    name: string;
    avatar?: string | null;
  };
};
