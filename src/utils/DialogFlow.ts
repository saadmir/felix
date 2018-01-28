import * as ApiAi from 'apiai';

const apiai = ApiAi("b01309813e3c410993cb1d753236881f");

export class DialogFlow {
  static Search(query: string) {
    const request = apiai.textRequest(query, {
      sessionId: 'some_session_id'
    });

    return new Promise((resolve, reject) => {
      request.on('response', (response) => {
        resolve(response);
      });

      request.on('error', function(error) {
        console.log(error);
        reject(error);
      });

      request.end();
    });
  }
}
