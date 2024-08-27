import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  private hubConnection: signalR.HubConnection;
  private messageSource = new BehaviorSubject<{
    user: string;
    message: string;
  }>({ user: '', message: '' });
  private activeUsers = new BehaviorSubject<string[]>([]);

  // Observables for components to subscribe to
  currentMessage = this.messageSource.asObservable();
  currentActiveUsers = this.activeUsers.asObservable();

  public userId: string;

  constructor() {
    const randomInt = Math.floor(Math.random() * 100);
    // Prompt user for ID and set default if not provided
    this.userId = 'User' + randomInt;

    // Create and start SignalR connection
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`https://localhost:7138/chatHub?userId=${this.userId}`)
      .build();

    this.hubConnection
      .start()
      .then(() => {
        console.log('Connection started');
        this.requestActiveUsers(); // Request active users after connection starts
      })
      .catch((err) => console.log('Error while starting connection: ' + err));

    // Handle incoming messages
    this.hubConnection.on('ReceiveMessage', (user: string, message: string) => {
      this.messageSource.next({ user, message });
    });

    // Handle updates to active users list
    this.hubConnection.on('ActiveUsers', (userIds: string[]) => {
      this.activeUsers.next(userIds);
    });
  }

  // Sends a message to a specific user
  sendMessage(receiverId: string, message: string) {
    this.hubConnection
      .invoke('SendMessage', this.userId, receiverId, message)
      .catch((err) => console.error(err));
  }

  // Requests the list of active users from the server
  requestActiveUsers() {
    this.hubConnection
      .invoke('GetActiveUsers') // Call method with user ID to exclude self
      .catch((err) => console.error(err));
  }
}
