import { Component, OnInit } from '@angular/core';
import { ConnectionService } from './services/connection.service';
import { Category } from './entity/Category';
import { Author } from './entity/Author';
import { Post } from './entity/Post';

@Component({
  selector: 'typeorm-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  post: Post;

  constructor(private connectionSvc: ConnectionService) {}

  async ngOnInit() {
    const connection = await this.connectionSvc.getConnection();

    const category1 = new Category();
    category1.name = "TypeScript";

    const category2 = new Category();
    category2.name = "Programming";

    const author = new Author();
    author.name = "Person";
    author.birthday = new Date();

    const post = new Post();
    post.title = "Control flow based type analysis";
    post.text = `TypeScript 2.0 implements a control flow-based type analysis for local variables and parameters.`;
    post.categories = [category1, category2];
    post.author = author;

    const postRepository = connection.getRepository(Post);
    await postRepository.save(post);

    this.post = post;
  }
}
