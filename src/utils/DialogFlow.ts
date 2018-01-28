import * as ApiAi from 'apiai';


export class DialogFlow {
  static Search(sessionId: string, query: string) {
    const apiai = ApiAi(process.env.DIALOGFLOW_API_KEY);
    const request = apiai.textRequest(query, {
      sessionId:  sessionId
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
