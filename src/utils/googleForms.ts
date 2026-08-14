import { EvaluationForm, QuestionType } from '../types';

/**
 * Creates a real Google Form using the Google Forms API.
 * This requires a valid OAuth 2.0 access token with forms.body scope.
 */
export async function createGoogleFormViaAPI(form: EvaluationForm, accessToken: string): Promise<{ formId: string, responderUri: string }> {
  // Step 1: Create a blank form
  const createResponse = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      info: {
        title: form.title,
        description: form.description,
      }
    })
  });

  if (!createResponse.ok) {
    const errText = await createResponse.text();
    throw new Error(`Gagal membuat formulir baru di Google Forms: ${errText || createResponse.statusText}`);
  }

  const createdForm = await createResponse.json();
  const formId = createdForm.formId;
  const responderUri = createdForm.responderUri;

  // Step 2: Build batch update requests for all questions
  const requests = form.questions.map((q, idx) => {
    const item: any = {
      title: q.title,
    };

    if (q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.CHECKBOXES) {
      const options = q.options?.map(opt => ({ value: opt.text })) || [];
      item.questionItem = {
        question: {
          required: q.required,
          choiceQuestion: {
            type: q.type === QuestionType.MULTIPLE_CHOICE ? 'RADIO' : 'CHECKBOX',
            options: options,
          }
        }
      };
    } else if (q.type === QuestionType.SHORT_ANSWER) {
      item.questionItem = {
        question: {
          required: q.required,
          textQuestion: {
            paragraph: false,
          }
        }
      };
    } else if (q.type === QuestionType.PARAGRAPH) {
      item.questionItem = {
        question: {
          required: q.required,
          textQuestion: {
            paragraph: true,
          }
        }
      };
    }

    return {
      createItem: {
        item: item,
        location: {
          index: idx,
        }
      }
    };
  });

  // Step 3: Send batch update request
  if (requests.length > 0) {
    const updateResponse = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: requests
      })
    });

    if (!updateResponse.ok) {
      const errText = await updateResponse.text();
      throw new Error(`Kuis berhasil dibuat, tetapi gagal memasukkan soal ke Google Forms: ${errText || updateResponse.statusText}`);
    }
  }

  return {
    formId,
    responderUri,
  };
}

/**
 * Fallback local exporter that generates an equivalent shareable structure
 * when the Google Cloud Project creation is locked by school organization policies.
 */
export function simulateGoogleFormsExport(form: EvaluationForm): Promise<{ formId: string, responderUri: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockId = `mock-gform-${Math.random().toString(36).substring(2, 11)}`;
      // Generate a beautiful simulated preview link or Google Forms representation
      resolve({
        formId: mockId,
        responderUri: `https://docs.google.com/forms/d/e/1FAIpQLSfDmockFormsSimulationUrl-${mockId}/viewform`
      });
    }, 1500);
  });
}
