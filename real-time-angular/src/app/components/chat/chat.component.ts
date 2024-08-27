import { Component, OnInit } from '@angular/core';
import { SignalRService } from 'src/app/services/signalr.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit {
  currentMessage: string = '';
  currentUser: string = '';
  selectedUser: string = '';
  chatMessages: { user: string; message: string }[] = [];
  onlineUsers: string[] = [];

  constructor(private signalRService: SignalRService) {}

  ngOnInit(): void {
    this.currentUser = this.signalRService.userId;

    this.signalRService.currentMessage.subscribe((message) => {
      if (message.user && message.message) {
        this.chatMessages.push(message);
      }
    });

    this.signalRService.currentActiveUsers.subscribe((users) => {
      if (users) {
        this.onlineUsers = users;
      }
    });
  }

  sendMessage(): void {
    this.signalRService.sendMessage(this.selectedUser, this.currentMessage);
    this.currentMessage = '';
  }

  getFilteredUsers(): string[] {
    return this.onlineUsers.filter((user) => user !== this.currentUser);
  }
}
