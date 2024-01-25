import { transcribeStream } from './speechToText.js';
class Queue {
    constructor() {
      this.items = [];
    }
  
    enqueue(item) {
      this.items.push(item);
    }
  
    dequeue() {
      if (this.isEmpty()) {
        return null;
      }
      return this.items.shift();
    }
  
    isEmpty() {
      return this.items.length === 0;
    }
  }
  
  // Then, replace the import statement with an instantiation of this Queue class
  const audioQueue = new Queue();
  
  import api from 'api';
  import * as PlayHT from "playht";
  import { createWriteStream } from 'fs';
  import { exec } from 'child_process';
  // import { Queue } from './Queue';
  
  // Initialize Perplexity API
  const sdk = api('@pplx/v0#b2wdhb1klq5dn1d6');
  sdk.auth('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');
  

  // PlayHT.init({
  //   apiKey: 'ed4427e56bb54e08acbfdd1c4094b978',
  //   userId: 'xBePK15dBoMrQ6WpZKJuiTvNFsV2',
  // });

  // Deepak
  // PlayHT.init({
  //   apiKey: 'aad1a48f7e784fd79e141ce16c251206',
  //   userId: 'HvhVkxtQXmf0RacSEoHJR5ujWxh1',
  // });

  // Himanshu Sir
  PlayHT.init({
    apiKey: 'ed9cd926252f4cf18cf3c29190056788',
    userId: 'L7utNgXonVS3cunq5DvhX4p9KC02',
  });
  
  const GenerationOptions = {
    voiceEngine: "PlayHT2.0-turbo",
    // voiceId: "s3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json",
    // voiceId: "s3://voice-cloning-zero-shot/b980184a-8255-4bf7-aac9-b1cb733a5543/jason/manifest.json",  Deepak
    voiceId: "s3://voice-cloning-zero-shot/103b2af8-f382-467c-9b45-77910c03eb54/jason/manifest.json",   // Himanshu Sir
  };
  
  console.log("Started at:",  new Date().toISOString());
 
  const playAudioWithFFplay = (fileName) => {
    return new Promise((resolve, reject) => {
      exec(`ffplay -autoexit -nodisp ${fileName}`, { stdio: ['pipe', 'pipe', 'ignore'] }, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          reject(error);
        } else {
          console.log(`Finished playing: ${fileName}`);
          console.log("Finished playing at:",  new Date().toISOString());
          resolve();
        }
      });
    });
  };
  
  
  const audioFiles = [];
  let nextFileIndex = 0;  // Index of the next file to be played
  let isPlaying = false;  // Flag to indicate if a file is currently being played
  
  const playAudioSequentially = () => {
    if (!isPlaying && nextFileIndex < audioFiles.length && audioFiles[nextFileIndex]) {
      isPlaying = true;
      const fileName = audioFiles[nextFileIndex];
      playAudioWithFFplay(fileName).then(() => {
        isPlaying = false;
        nextFileIndex++;
        playAudioSequentially();
      });
    }
  };
  
  let accumulatedSentence = '';
  let lastProcessedPosition = 0;
  let previousPlayPromise = Promise.resolve();
  let sentenceIndex = 0;
  
  
  // Process sentences and store them in order
  const processSentence = (sentenceToProcess, sentenceIndex) => {
    streamSentenceToAudio(sentenceToProcess, sentenceIndex).then(tempFileName => {
      if (tempFileName) {
        audioFiles[sentenceIndex - 1] = tempFileName; // Store the file name at the correct index
        if (sentenceIndex - 1 === nextFileIndex) {
          playAudioSequentially(); // Attempt to play next audio
        }
      }
    });
  };


  const streamSentenceToAudio = async (sentence, index) => {
    if (!sentence || !sentence.trim()) {
        console.error(`Received empty or invalid content for sentence ${index}`);
        return null;
    }
    // Convert time formats to speech-friendly format
    sentence = convertTimeForSpeech(sentence);

    const tempFileName = `temp_sentence_${index}.mp3`;
    const fileStream = createWriteStream(tempFileName);

    try {
        console.log(`Processing sentence ${index}: ${sentence}`);
        const stream = await PlayHT.stream(sentence, GenerationOptions);

        return new Promise((resolve, reject) => {
            stream.on('data', (chunk) => {
                fileStream.write(chunk);
            });

            stream.on('end', () => {
                fileStream.end();
                console.log(`Finished processing sentence ${index}`);
                console.log(new Date().toISOString());
                resolve(tempFileName);
            });

            stream.on('error', (error) => {
                console.error(`Error processing sentence ${index}:`, error);

                // Check if the error is RESOURCE_EXHAUSTED
                if (error.code === 8) {
                    console.log(`Retrying sentence ${index} after delay due to resource exhaustion`);
                    setTimeout(() => {
                        resolve(streamSentenceToAudio(sentence, index)); // Retry after a delay
                    }, 5000); // 5-second delay, adjust as necessary
                } else {
                    fileStream.close();
                    reject(error);
                }
            });
        });
    } catch (error) {
        console.error(`Error streaming sentence ${index}:`, error);
        return null;
    }
};


let script = 
"RESPOND WITH A VERY SHORT ANSWER. You are a receptionist named Jacob. Your task is to give demo about the academy to the user who is calling you and answer their queries by following the given script information: "+
"Greeting: Hello, welcome to Fight Flow Academy! I'm Jacob. How can I help you start your fitness and martial arts journey today?" +
"Rapport Building and Identifying Needs:If the caller has a specific inquiry:Absolutely, I can help with that. May I have your name and what you're specifically looking for?"+
"If the caller is unsure: Let's explore what suits you best. What are your goals and interests in martial arts or fitness training? We have a diverse range of programs for different needs."+
"Providing Information and Addressing Concerns:Our academy offers a wide range of classes, including MMA, Boxing, HIIT Boxing, Muay Thai, and more. Each class is tailored for different skill levels, from beginners to advanced. If you have any specific questions, like about schedules, trainer qualifications, or safety measures, I'm here to answer them. please  resond around 25-30 words only"+
"Trainer and Facility Highlight: Our expert trainers are here to guide you, and our top-tier facilities ensure a great training experience. respond only 20-25 words only"+
"Benefits of Joining: Joining us means more than just exercise. You'll gain fitness, self-defense skills, and join a supportive community."+
"Services Overview:At Fight Flow Academy, we pride ourselves on offering a diverse range of classes like MMA, Boxing, HIIT Boxing, Muay Thai, Kickboxing, Youth Boxing, Jiu Jitsu, and Yoga. Whether you're just starting out or are an experienced athlete, we have programs that cater to every skill level and interest. Respond only 20-25 words around only.  "+
"Community, Safety, and Facilities:We're not just a training center; we're a community. We host member events and have a strong focus on creating a supportive environment. Also, our safety protocols and emergency procedures are top-notch, ensuring everyone's well-being."+
"Membership, Free Trial Class, and Follow-Up:Our membership is $100 per month, granting you access to all classes. I'd suggest starting with a free trial class to see what we offer. Afterward, we'll follow up to hear your thoughts and answer any further questions."+
"Referral Program, Testimonials, and Accessibility:We have a referral program with benefits for both you and your friends. Also, our members have shared inspiring success stories, which I'd be happy to send you. And don't worry about accessibility – our facilities are equipped to welcome everyone."+
"Closing and Action Encouragement:How about we schedule a trial class for you? This is a great opportunity to experience our academy. We have a few slots left in our popular classes. What day works best for you?"+
"If they need time: I understand. Can I send you more details via email? What's your email address?"+
"If They Are Hesitant or Not Interested:I completely understand if you're not ready to commit. However, I'd highly recommend our free trial classes. They're a great way to experience our academy's atmosphere and training quality firsthand, with no obligation to join. Many of our now-enthusiastic members started with a trial and found it invaluable in making their decision. How about we schedule a free trial for you to see the benefits for yourself?"+
"If  user Mentions High Charges:I understand that the cost might seem higher compared to others. However, our fee reflects the quality and variety of classes we offer, along with access to experienced trainers and state-of-the-art facilities. It's more than just a membership; it's an investment in your personal growth and health. We also have free trial classes, so you can experience the value firsthand before making a decision. Would you like to try a class and see the difference for yourself?"+
"If user is Still Not Interested:I completely respect your decision. But if I may suggest, attending a trial class could give you a new perspective without any commitment. Our trial sessions have often changed minds by offering a real feel of the Fight Flow experience. It's completely free, and there's no obligation to sign up afterward. It could be a valuable opportunity to explore something new. Would you be open to giving it a try? It's just one class, and who knows, you might find it more appealing than you expect"+
"If user Asks About the Difference Between Trainers or Benefits Compared to Other Academies: I'm glad you asked about that. What truly sets our trainers apart at Fight Flow Academy is their commitment to personal development, not just in martial arts skills but also in building mental strength and resilience. They're more than instructors; they're mentors who personalize training to fit each individual's needs. Also, our academy is unique in its strong community focus. We don't just offer classes; we build a supportive environment that encourages growth and inspiration. Our state-of-the-art facilities enhance this experience. This combination of expert, personalized training, a nurturing community, and excellent facilities offers a comprehensive experience that you might not find elsewhere. Would you like to experience this difference firsthand by trying a free trial class?"+
"If the question asked by the user is very unrelated to the class or academy then Say I don't know or sorry, I didn't understand your question."+
"if the user's question you are receiving is created using speech to text so there may be errors, such as 'classes' might be written as 'glasses' etc then analyize it and correct the word according to the academy related questions and correct it by yourself."+
"If user Asks About the address of Fight Flow Academy, the address is- 900 E Six Forks Road, Raleigh, North Carolina."+
"If user Requests a Discount Due to High Charges:I understand your concern about the cost. While our pricing reflects the high quality of training and facilities we offer, I appreciate that it's a significant consideration for you. While we don't typically offer discounts on our standard membership, I can check for any current promotions or special offers that might be available. Alternatively, I highly recommend trying our free trial class first. This way, you can experience the value and quality we offer, which might help you see the benefits that justify the cost. How does that sound?"+
"Try to convience the user to get a free trial class, if the user say the cost of the membership is very high or expensive and also tell him that we offer EMI options for paying the membership fees."+
"Final Remarks:Thank you for considering Fight Flow Academy. We value your feedback and are dedicated to improving our services. Please share any thoughts with us. Remember, every journey starts with a single step, and we're here to guide and support you every step of the way. Have a great day!"+
"In the end If user is not interested then try to Convience the caller to buy the membership or come to the academy to get a free trial class."+
"You are having a conversation.Only respond to the last query in 1 or 2 sentences."+
"Each and every Respond in around 20-25 words only, not more than that..";


// Function to convert time formats in a sentence to a speech-friendly format
function convertTimeForSpeech(text) {
  return text.replace(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi, (match, hour, minute, meridiem) => {
      hour = parseInt(hour);
      minute = parseInt(minute);
      if (minute === 0) {
          return `${hour} ${meridiem}`;
      } else {
          return `${hour} ${minute === 30 ? 'thirty' : minute} ${meridiem}`;
      }
  });
}

async function main() {
  let chatHistory = [];

  // Spawn Python script as a child process
  const pythonProcess = spawn('python', ['end_call.py', process.pid.toString()]);

    // Event listener for Python process exit
  pythonProcess.on('exit', (code) => {
      console.log(`Python process exited with code ${code}`);
        // Handle the exit of the Python script, maybe clean up or restart your Node.js logic
  });

  
  while (true) { // Loop until a break condition is met
      try {
          const transcript = await transcribeStream();
          console.log('Received Transcript:', transcript);

          // Check for a special command to exit the loop, such as "exit"
          if (transcript.toLowerCase().trim() === 'exit') {
              console.log('Exiting...');
              break;
          }

          // Process the transcript if it's not empty
          if (transcript && transcript.trim() !== '') {
	       
              console.log("Pplx Started at:", new Date().toISOString());
              chatHistory.push({ role: 'user', content: transcript });
              let fullResponse = '';              
              await sdk.post_chat_completions({
                  model: 'llama-2-70b-chat',
                  messages: [
                      { role: 'system', content: script },
                      // { role: 'user', content: transcript }
                      ...chatHistory
                  ],
                  stream: true
              })
              
              .then(response => {
                  const dataChunks = response.data.split('\r\n').filter(chunk => chunk.startsWith('data:'));
              
                  dataChunks.forEach(chunk => {
                      const jsonData = JSON.parse(chunk.substring(5));
                  
                      if (jsonData.choices && jsonData.choices.length > 0) {
                          const newContent = jsonData.choices[0].message.content;
                          const newPart = newContent.substring(lastProcessedPosition);
                          // console.log("Chunk received at:", new Date().toISOString());
                          lastProcessedPosition = newContent.length;
                          accumulatedSentence += newPart;
                          fullResponse += newPart;
                          console.log('new part' + newPart);
 
                      
                          // Check if accumulated text contains a sentence-ending punctuation
                          if (/[.?!]/.test(accumulatedSentence)) {
                            // Find the position of the first sentence-ending punctuation
                            const endOfSentenceIndex = accumulatedSentence.search(/[.?!]/) + 1;

                            // Extract the sentence up to the punctuation
                            const sentenceToProcess = accumulatedSentence.substring(0, endOfSentenceIndex).trim();
                            accumulatedSentence = accumulatedSentence.substring(endOfSentenceIndex).trim(); // Reset for next sentence

                            // Log the sentence being processed for debugging
                            console.log(`Processing sentence ${sentenceIndex}: "${sentenceToProcess}"`);

                            // Only call processSentence if the extracted sentence is not empty and contains meaningful text (excluding punctuation)
                            if (sentenceToProcess && /[a-zA-Z0-9]/.test(sentenceToProcess)) {
                                processSentence(sentenceToProcess, ++sentenceIndex);
                                console.log('Sentence sent for processing: '+new Date().toISOString());
                            } else {
                                console.error(`Empty or invalid sentence encountered at index ${sentenceIndex}`);
                            }
                          }

                      }
                  });
                console.log("Full Response:", fullResponse);
                chatHistory.push({ role: 'assistant', content: fullResponse });
                console.log("Chat History:", chatHistory);
                })
              .catch(err => console.error(err));
              
          }
      } catch (error) {
          console.error('Failed to get transcript:', error);
      }
  }
}

main();
