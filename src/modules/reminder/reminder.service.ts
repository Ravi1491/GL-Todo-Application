import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TodoService } from '../todo/todo.service';

@Injectable()
export class RemainderService {
  
  constructor(
    private todoService: TodoService,
    private mailService: MailerService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)   
  async sendTodoRemainder(){
    let todo = this.todoService;
    let TodosNotCompleted = await todo.findPendingTodos();
    let TodosData = TodosNotCompleted.map(item => ({ email: item.user.email, id:item.id, title: item.title , due_date: item.due_date }))

    let TodosSendMail = TodosData.filter(function(item){
      let currentDateTime = new Date()
      let EndDateTime = new Date(item.due_date)
      let initialTime = new Date("1970-01-01T00:00:00.000Z");
      
      if(EndDateTime.getTime() == initialTime.getTime()){
        return;
      }
      
      let TimeLeft = ((EndDateTime.getTime()) - (currentDateTime.getTime()))/(1000 * 60 * 60); 
      TimeLeft = (Math.floor(TimeLeft))

      if(TimeLeft < 0){
        todo.overDue(item.id);
      }

      if(TimeLeft == 24){
        return item.email;
      }

    })
    
    if(TodosSendMail.length !== 0){
      TodosSendMail.map(item => ({
        this: this.mailService.sendMail({
          from: 'todo@gmail.com',
          to: item.email,
          subject: "Remainder",
          text: `${item.title} - 1 day remaining, compeleted ASAP.`
        })
      }))
    }
  }

}
